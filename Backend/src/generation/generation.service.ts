import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGenerationJobDto {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}

interface GeneratedExample {
  sentence: string;
  translation?: string;
}

interface GeneratedItem {
  phrase: string;
  translation: string;
  pinyin?: string;
  blank: string;
  answer: string;
  options: string[];
  examples: GeneratedExample[];
  exampleSentence?: string;
  quizPrompt: string;
  usage: string;
  register: string;
  cefr: string;
}

interface GenerationResult {
  items: GeneratedItem[];
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  retryCount: number;
}

class AiRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
  }
}

class AiGenerationError extends Error {
  constructor(message: string, readonly retryCount: number) {
    super(message);
  }
}

const CATEGORIES = new Set(['workplace', 'smalltalk', 'travel', 'emotions', 'random']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const PROMPT_VERSION = 'v1.3.0';
const DEFAULT_DEEPSEEK_URL = 'https://api.deepseek.com';
const CHUNK_JSON_EXAMPLE = `{
  "items": [
    {
      "phrase": "touch base",
      "translation": "簡短聯絡一下",
      "blank": "Let's ___ tomorrow about the launch.",
      "answer": "touch base",
      "options": ["touch base", "hit the road", "break the ice"],
      "examples": [
        {"sentence": "Let's touch base before the meeting.", "translation": "開會前先聯絡一下。"},
        {"sentence": "I will touch base with the client later.", "translation": "我稍後會跟客戶聯絡。"}
      ],
      "quizPrompt": "Choose the most natural phrase.",
      "usage": "Used to briefly sync progress at work.",
      "register": "neutral",
      "cefr": "B1"
    }
  ]
}`;
const CHUNK_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['phrase', 'translation', 'blank', 'answer', 'options', 'examples', 'quizPrompt', 'usage', 'register', 'cefr'],
        properties: {
          phrase: { type: 'string' },
          translation: { type: 'string' },
          blank: { type: 'string' },
          answer: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
          examples: {
            type: 'array',
            minItems: 2,
            maxItems: 4,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['sentence', 'translation'],
              properties: {
                sentence: { type: 'string' },
                translation: { type: 'string' },
              },
            },
          },
          quizPrompt: { type: 'string' },
          usage: { type: 'string' },
          register: { type: 'string' },
          cefr: { type: 'string' },
        },
      },
    },
  },
  required: ['items'],
};

@Injectable()
export class GenerationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GenerationService.name);
  private timer?: NodeJS.Timeout;
  private polling = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.GENERATION_WORKER_ENABLED === 'false') return;
    this.timer = setInterval(() => void this.runNextPendingJob(), 5_000);
    void this.runNextPendingJob();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async createJob(dto: CreateGenerationJobDto, createdById?: string) {
    this.validateJob(dto);
    const today = new Date().toISOString().slice(0, 10);
    const dailyJobs = await this.prisma.generationJob.count({
      where: { startedAt: { gte: new Date(`${today}T00:00:00.000Z`) } },
    });
    const dailyLimit = Number(process.env.GENERATION_DAILY_JOB_LIMIT || 20);
    if (dailyJobs >= dailyLimit) throw new Error('Daily generation limit reached');

    const job = await this.prisma.generationJob.create({
      data: {
        jobType: 'content-batch',
        status: 'pending',
        batchSize: Math.min(dto.batchSize, 50),
        triggerReason: dto.triggerReason,
        category: dto.category,
        difficulty: dto.difficulty,
        provider: this.aiProvider(),
        model: this.aiModel(),
        promptVersion: PROMPT_VERSION,
        createdById,
      },
    });
    queueMicrotask(() => void this.runNextPendingJob());
    return job;
  }

  async createAndRunJob(dto: CreateGenerationJobDto) {
    this.validateJob(dto);
    const job = await this.prisma.generationJob.create({
      data: {
        jobType: 'content-batch',
        status: 'running',
        batchSize: dto.batchSize,
        triggerReason: dto.triggerReason,
        category: dto.category,
        difficulty: dto.difficulty,
        provider: this.aiProvider(),
        model: this.aiModel(),
        promptVersion: PROMPT_VERSION,
      },
    });
    return this.runJob(job.id, dto);
  }

  private async runJob(jobId: string, dto: CreateGenerationJobDto) {
    try {
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: 'running', startedAt: new Date(), errorMessage: null },
      });
      const generation = await this.generateItems(
        dto.category,
        dto.difficulty,
        Math.max(1, dto.batchSize),
      );
      const candidateKeys = generation.items.map((item) => this.phraseKey(item.phrase));
      const existing = await this.prisma.chunk.findMany({
        where: { phraseKey: { in: candidateKeys } },
        select: { phraseKey: true },
      });
      const existingKeys = new Set(existing.map((chunk) => chunk.phraseKey));
      const generatedItems = generation.items.filter(
        (item) => !existingKeys.has(this.phraseKey(item.phrase)),
      );
      if (!generatedItems.length) {
        throw new Error('The model returned no new globally unique content');
      }

      const contentPoolItem = await this.prisma.contentPoolItem.create({
        data: {
          category: dto.category,
          difficulty: dto.difficulty,
          status: 'generating',
          qualityScore: 0,
          generationJobId: jobId,
        },
      });

      for (const item of generatedItems) {
        try {
          const chunk = await this.prisma.chunk.create({
            data: {
              contentPoolItemId: contentPoolItem.id,
              phrase: item.phrase.trim(),
              phraseKey: this.phraseKey(item.phrase),
              translation: item.translation.trim(),
              pinyin: item.pinyin?.trim() || null,
              usage: item.usage.trim(),
              register: item.register.trim(),
              cefr: item.cefr.trim().toUpperCase(),
              category: dto.category,
              difficulty: dto.difficulty,
              blank: item.blank.trim(),
              answer: item.answer.trim(),
              options: item.options.map((option) => option.trim()),
              status: 'active',
            },
          });

          await this.prisma.chunkExample.createMany({
            data: item.examples.map((example, orderIndex) => ({
              chunkId: chunk.id,
              sentence: example.sentence.trim(),
              translation: example.translation?.trim() || null,
              orderIndex,
            })),
          });

          await this.prisma.quizQuestion.create({
            data: {
              contentPoolItemId: contentPoolItem.id,
              prompt: item.quizPrompt.trim(),
              correctAnswerChunkId: chunk.id,
              difficulty: dto.difficulty,
              status: 'active',
            },
          });
        } catch (error) {
          if (this.isUniqueConflict(error)) {
            this.logger.warn(`Skipped duplicate generated phrase: ${item.phrase}`);
            continue;
          }
          throw error;
        }
      }

      const persistedCount = await this.prisma.chunk.count({
        where: { contentPoolItemId: contentPoolItem.id },
      });
      if (!persistedCount) throw new Error('All generated phrases were duplicates');

      await this.prisma.contentPoolItem.update({
        where: { id: contentPoolItem.id },
        data: {
          status: 'pending_review',
          qualityScore: this.qualityScore(generatedItems),
        },
      });

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: 'success',
          completedAt: new Date(),
          provider: generation.provider,
          model: generation.model,
          promptVersion: PROMPT_VERSION,
          inputTokens: generation.inputTokens,
          outputTokens: generation.outputTokens,
          estimatedCost: this.estimatedCost(
            generation.model,
            generation.inputTokens,
            generation.outputTokens,
          ),
          retryCount: generation.retryCount,
        },
      });

      return { id: jobId, status: 'success', batchSize: dto.batchSize, generatedCount: persistedCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown generation error';
      this.logger.error(`Generation job ${jobId} failed`, message);
      await this.prisma.contentPoolItem.deleteMany({
        where: { generationJobId: jobId, status: 'generating' },
      });
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: message,
          retryCount: error instanceof AiGenerationError ? error.retryCount : undefined,
        },
      });
      throw new Error(message);
    }
  }

  private async runNextPendingJob() {
    if (this.polling) return;
    this.polling = true;
    try {
      const job = await this.prisma.generationJob.findFirst({
        where: { status: 'pending' },
        orderBy: { startedAt: 'asc' },
      });
      if (!job || !job.category || !job.difficulty) return;
      const claimed = await this.prisma.generationJob.updateMany({
        where: { id: job.id, status: 'pending' },
        data: { status: 'running', startedAt: new Date() },
      });
      if (!claimed.count) return;
      await this.runJob(job.id, {
        category: job.category,
        difficulty: job.difficulty,
        batchSize: job.batchSize,
        triggerReason: job.triggerReason,
      });
    } catch (error) {
      this.logger.error(
        'Generation worker poll failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.polling = false;
    }
  }

  async getJobs() {
    return this.prisma.generationJob.findMany({ orderBy: { startedAt: 'desc' } });
  }

  async getJob(id: string) {
    return this.prisma.generationJob.findUnique({ where: { id } });
  }

  private async generateItems(
    category: string,
    difficulty: string,
    batchSize: number,
  ): Promise<GenerationResult> {
    const existingPhrases = await this.existingPhrases(category);
    const generation = await this.tryGenerateWithAi(
      category,
      difficulty,
      batchSize,
      existingPhrases,
    );
    return { ...generation, items: this.validateItems(generation.items) };
  }

  private async existingPhrases(category: string): Promise<string[]> {
    const limit = this.numberEnv('EXISTING_PHRASE_PROMPT_LIMIT', 1000, 0, 5000);
    if (limit === 0) return [];
    const rows = await this.prisma.chunk.findMany({
      where: { category },
      select: { phrase: true, phraseKey: true },
      orderBy: { phraseKey: 'asc' },
      take: limit,
    });
    const seen = new Set<string>();
    const phrases: string[] = [];
    for (const row of rows) {
      const key = row.phraseKey || this.phraseKey(row.phrase);
      const phrase = row.phrase?.trim() || row.phraseKey?.trim();
      if (!key || !phrase || seen.has(key)) continue;
      seen.add(key);
      phrases.push(phrase);
    }
    return phrases;
  }

  private async tryGenerateWithAi(
    category: string,
    difficulty: string,
    batchSize: number,
    existingPhrases: string[] = [],
  ): Promise<GenerationResult> {
    const apiKey = this.aiApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY or AI_API_KEY is not configured');
    }

    const model = this.aiModel();
    const provider = this.aiProvider();
    const endpoint = this.aiBaseUrl();
    const prompt = this.generationPrompt(category, difficulty, batchSize, existingPhrases);
    const maxAttempts = this.numberEnv('GENERATION_MAX_ATTEMPTS', 3, 1, 5);
    const timeoutMs = this.numberEnv('GENERATION_REQUEST_TIMEOUT_MS', 60_000, 1_000, 180_000);
    const maxTokens = this.numberEnv('GENERATION_MAX_TOKENS', 8_192, 512, 32_768);
    let lastError: unknown;
    let attemptsMade = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsMade = attempt;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: maxTokens,
            response_format: this.responseFormat(),
            messages: [
              {
                role: 'system',
                content: 'You are a senior ESL curriculum editor. Produce accurate, natural, safe learning content as json. Never repeat phrases the user lists as already existing.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          throw new AiRequestError(
            `AI request failed with ${response.status}`,
            response.status === 408 || response.status === 429 || response.status >= 500,
          );
        }

        const payload = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const content = payload.choices?.[0]?.message?.content ?? '';
        const parsed = this.parseModelJson(content);
        return {
          items: Array.isArray(parsed.items) ? parsed.items : [],
          provider,
          model,
          inputTokens: payload.usage?.prompt_tokens ?? 0,
          outputTokens: payload.usage?.completion_tokens ?? 0,
          retryCount: attempt - 1,
        };
      } catch (error) {
        lastError = error;
        const retryable = !(error instanceof AiRequestError) || error.retryable;
        if (!retryable || attempt === maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, Math.min(250 * (2 ** (attempt - 1)), 2_000)));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new AiGenerationError(
      `AI generation failed after ${attemptsMade} attempt(s): ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
      Math.max(0, attemptsMade - 1),
    );
  }

  private aiApiKey(): string {
    return (
      process.env.AI_API_KEY?.trim()
      || process.env.DEEPSEEK_API_KEY?.trim()
      || process.env.OPENAI_API_KEY?.trim()
      || ''
    );
  }

  private aiBaseUrl(): string {
    return (process.env.AI_BASE_URL || DEFAULT_DEEPSEEK_URL).replace(/\/+$/, '');
  }

  private isDeepSeek(): boolean {
    return this.aiBaseUrl().includes('deepseek.com');
  }

  private aiProvider(): string {
    if (process.env.AI_PROVIDER?.trim()) return process.env.AI_PROVIDER.trim();
    return this.isDeepSeek() ? 'deepseek' : 'openai';
  }

  private aiModel(): string {
    if (process.env.AI_MODEL?.trim()) return process.env.AI_MODEL.trim();
    if (process.env.OPENAI_MODEL?.trim()) return process.env.OPENAI_MODEL.trim();
    return this.isDeepSeek() ? 'deepseek-v4-pro' : 'gpt-4o-mini';
  }

  private usesJsonSchema(): boolean {
    const mode = process.env.AI_JSON_MODE?.trim();
    if (mode === 'schema') return true;
    if (mode === 'object') return false;
    return !this.isDeepSeek();
  }

  private responseFormat(): Record<string, unknown> {
    if (!this.usesJsonSchema()) return { type: 'json_object' };
    return {
      type: 'json_schema',
      json_schema: {
        name: 'chunk_batch',
        strict: true,
        schema: CHUNK_JSON_SCHEMA,
      },
    };
  }

  private generationPrompt(
    category: string,
    difficulty: string,
    batchSize: number,
    existingPhrases: string[] = [],
  ): string {
    const parts = [
      `Generate ${batchSize} English chunks for Traditional Chinese learners.`,
      `Category=${category}; difficulty=${difficulty}.`,
      'Each item needs a natural phrase, Traditional Chinese translation, cloze sentence, exact answer, 3 plausible options containing the answer, at least 2 natural examples with Traditional Chinese translations, quiz prompt, concise usage note, register, and CEFR.',
      'Avoid duplicates and unsafe content.',
    ];
    if (existingPhrases.length) {
      parts.push(
        `Do not reuse any existing ${category} phrase below. Treat them as case-insensitive and ignore extra spaces. Generate ${batchSize} phrases that are not in this list:`,
        existingPhrases.join(' | '),
      );
    }
    parts.push(
      'Return json only, as an object with an items array matching this example json:',
      CHUNK_JSON_EXAMPLE,
    );
    return parts.join(' ');
  }

  private parseModelJson(content: string): { items?: GeneratedItem[] } {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('AI returned empty content');
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenced?.[1]?.trim() || trimmed;
    const parsed = JSON.parse(raw) as { items?: GeneratedItem[] } | GeneratedItem[];
    if (Array.isArray(parsed)) return { items: parsed };
    return parsed;
  }

  private validateJob(dto: CreateGenerationJobDto) {
    if (!CATEGORIES.has(dto.category)) throw new Error('Unsupported category');
    if (!DIFFICULTIES.has(dto.difficulty)) throw new Error('Unsupported difficulty');
    if (!Number.isInteger(dto.batchSize) || dto.batchSize < 1 || dto.batchSize > 50) {
      throw new Error('batchSize must be between 1 and 50');
    }
  }

  private validateItems(items: GeneratedItem[]): GeneratedItem[] {
    const seen = new Set<string>();
    return items.flatMap((item) => {
      const phrase = this.phraseKey(item.phrase || '');
      const options = Array.isArray(item.options) ? item.options : [];
      const examples = Array.isArray(item.examples)
        ? item.examples
            .map((example) => typeof example === 'string' ? { sentence: example } : example)
            .filter((example) => example?.sentence?.trim())
        : item.exampleSentence?.trim()
          ? [{ sentence: item.exampleSentence }]
          : [];
      if (
        !phrase ||
        seen.has(phrase) ||
        !item.translation?.trim() ||
        !item.usage?.trim() ||
        !item.register?.trim() ||
        !/^(A1|A2|B1|B2|C1|C2)$/i.test(item.cefr?.trim() || '') ||
        examples.length < 2 ||
        !item.blank?.includes('___') ||
        options.length < 3 ||
        !options.some((option) => option.toLowerCase() === item.answer?.toLowerCase())
      ) {
        return [];
      }
      seen.add(phrase);
      return [{ ...item, examples }];
    });
  }

  private qualityScore(items: GeneratedItem[]): number {
    if (!items.length) return 0;
    const complete = items.filter((item) => item.usage && item.register && item.cefr).length;
    return Number((0.7 + (complete / items.length) * 0.25).toFixed(2));
  }

  private phraseKey(phrase: string): string {
    return phrase.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private isUniqueConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private numberEnv(name: string, fallback: number, min: number, max: number): number {
    const parsed = Number(process.env[name]);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private estimatedCost(model: string, inputTokens: number, outputTokens: number): number {
    const defaultInputRate = model === 'gpt-4o-mini' ? 0.15 : 0;
    const defaultOutputRate = model === 'gpt-4o-mini' ? 0.6 : 0;
    const inputRate = this.decimalEnv('OPENAI_INPUT_COST_PER_MILLION', defaultInputRate);
    const outputRate = this.decimalEnv('OPENAI_OUTPUT_COST_PER_MILLION', defaultOutputRate);
    return Number((((inputTokens * inputRate) + (outputTokens * outputRate)) / 1_000_000).toFixed(8));
  }

  private decimalEnv(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
}
