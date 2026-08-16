import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGenerationJobDto {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}

interface GeneratedItem {
  phrase: string;
  translation: string;
  pinyin?: string;
  blank: string;
  answer: string;
  options: string[];
  exampleSentence: string;
  quizPrompt: string;
  usage?: string;
  register?: string;
  cefr?: string;
}

const CATEGORIES = new Set(['workplace', 'smalltalk', 'travel', 'emotions', 'random']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const PROMPT_VERSION = 'v1.0.0';

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

    const idempotencyKey = createHash('sha256')
      .update(`${createdById || 'system'}:${dto.category}:${dto.difficulty}:${dto.triggerReason}:${today}`)
      .digest('hex');
    const existing = await this.prisma.generationJob.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;
    const job = await this.prisma.generationJob.create({
      data: {
        jobType: 'content-batch',
        status: 'pending',
        batchSize: Math.min(dto.batchSize, 50),
        triggerReason: dto.triggerReason,
        category: dto.category,
        difficulty: dto.difficulty,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        promptVersion: PROMPT_VERSION,
        idempotencyKey,
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
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        promptVersion: PROMPT_VERSION,
      },
    });
    return this.runJob(job.id, dto);
  }

  private async runJob(jobId: string, dto: CreateGenerationJobDto) {
    try {
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: 'running', startedAt: new Date() },
      });
      const contentPoolItem = await this.prisma.contentPoolItem.create({
        data: {
          category: dto.category,
          difficulty: dto.difficulty,
          status: 'generating',
          qualityScore: 0,
          generationJobId: jobId,
        },
      });

      const generatedItems = await this.generateItems(dto.category, dto.difficulty, Math.max(1, dto.batchSize));
      if (!generatedItems.length) throw new Error('The model returned no valid content');

      for (const item of generatedItems) {
        const chunk = await this.prisma.chunk.create({
          data: {
            contentPoolItemId: contentPoolItem.id,
            phrase: item.phrase,
            translation: item.translation,
            pinyin: item.pinyin ?? null,
            category: dto.category,
            difficulty: dto.difficulty,
            blank: item.blank,
            answer: item.answer,
            options: item.options,
            status: 'active',
          },
        });

        await this.prisma.chunkExample.create({
          data: {
            chunkId: chunk.id,
            sentence: item.exampleSentence,
          },
        });

        const quiz = await this.prisma.quizQuestion.create({
          data: {
            contentPoolItemId: contentPoolItem.id,
            prompt: item.quizPrompt,
            correctAnswerChunkId: chunk.id,
            difficulty: dto.difficulty,
            status: 'active',
          },
        });

        void quiz;
      }

      await this.prisma.contentPoolItem.update({
        where: { id: contentPoolItem.id },
        data: {
          status: 'pending_review',
          qualityScore: this.qualityScore(generatedItems),
        },
      });

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: 'success', completedAt: new Date() },
      });

      return { id: jobId, status: 'success', batchSize: dto.batchSize, generatedCount: generatedItems.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown generation error';
      this.logger.error(`Generation job ${jobId} failed`, message);
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: message,
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

  private async generateItems(category: string, difficulty: string, batchSize: number): Promise<GeneratedItem[]> {
    const aiItems = await this.tryGenerateWithAi(category, difficulty, batchSize);
    return this.validateItems(aiItems);
  }

  private async tryGenerateWithAi(category: string, difficulty: string, batchSize: number): Promise<GeneratedItem[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Generate ${batchSize} English chunks for Traditional Chinese learners. Category=${category}; difficulty=${difficulty}. Each item needs a natural phrase, Traditional Chinese translation, cloze sentence, exact answer, 3 plausible options containing the answer, natural example, quiz prompt, concise usage note, register, and CEFR. Avoid duplicates and unsafe content.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.4,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'chunk_batch',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['phrase', 'translation', 'blank', 'answer', 'options', 'exampleSentence', 'quizPrompt', 'usage', 'register', 'cefr'],
                      properties: {
                        phrase: { type: 'string' },
                        translation: { type: 'string' },
                        blank: { type: 'string' },
                        answer: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
                        exampleSentence: { type: 'string' },
                        quizPrompt: { type: 'string' },
                        usage: { type: 'string' },
                        register: { type: 'string' },
                        cefr: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['items'],
              },
            },
          },
          messages: [
            {
              role: 'system',
              content: 'You are a senior ESL curriculum editor. Produce accurate, natural, safe learning content.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with ${response.status}`);
      }

      const payload = await response.json() as any;
      const content = payload?.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content);
      const usage = payload?.usage;
      if (usage) {
        this.logger.log(`OpenAI tokens prompt=${usage.prompt_tokens || 0} completion=${usage.completion_tokens || 0}`);
      }
      return Array.isArray(parsed?.items) ? parsed.items : [];
    } catch (error) {
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : error}`);
    }
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
    return items.filter((item) => {
      const phrase = item.phrase?.trim().toLowerCase();
      const options = Array.isArray(item.options) ? item.options : [];
      if (
        !phrase ||
        seen.has(phrase) ||
        !item.translation?.trim() ||
        !item.exampleSentence?.trim() ||
        !item.blank?.includes('___') ||
        options.length < 3 ||
        !options.some((option) => option.toLowerCase() === item.answer?.toLowerCase())
      ) {
        return false;
      }
      seen.add(phrase);
      return true;
    });
  }

  private qualityScore(items: GeneratedItem[]): number {
    if (!items.length) return 0;
    const complete = items.filter((item) => item.usage && item.register && item.cefr).length;
    return Number((0.7 + (complete / items.length) * 0.25).toFixed(2));
  }
}
