import { Injectable, Logger } from '@nestjs/common';
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
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAndRunJob(dto: CreateGenerationJobDto): Promise<{ id: string; status: string; batchSize: number; generatedCount: number }> {
    const job = await this.prisma.generationJob.create({
      data: {
        jobType: 'content-batch',
        status: 'running',
        batchSize: dto.batchSize,
        triggerReason: dto.triggerReason,
      },
    });

    try {
      const contentPoolItem = await this.prisma.contentPoolItem.create({
        data: {
          category: dto.category,
          difficulty: dto.difficulty,
          status: 'generating',
          qualityScore: 0,
        },
      });

      const generatedItems = await this.generateItems(dto.category, dto.difficulty, Math.max(1, dto.batchSize));

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

        await this.prisma.quizQuestion.create({
          data: {
            contentPoolItemId: contentPoolItem.id,
            prompt: item.quizPrompt,
            correctAnswerChunkId: chunk.id,
            difficulty: dto.difficulty,
            status: 'active',
          },
        });
      }

      await this.prisma.contentPoolItem.update({
        where: { id: contentPoolItem.id },
        data: {
          status: 'pending_review',
          qualityScore: 0.8,
        },
      });

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: { status: 'success', completedAt: new Date() },
      });

      return { id: job.id, status: 'success', batchSize: dto.batchSize, generatedCount: generatedItems.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown generation error';
      this.logger.error(`Generation job ${job.id} failed`, message);
      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: message,
        },
      });
      throw new Error(message);
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
    if (aiItems.length > 0) {
      return aiItems;
    }

    return this.buildFallbackItems(category, difficulty, batchSize);
  }

  private async tryGenerateWithAi(category: string, difficulty: string, batchSize: number): Promise<GeneratedItem[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return [];
    }

    const prompt = `Generate ${batchSize} language-learning content items for category ${category}, difficulty ${difficulty}. Return valid JSON only with this shape: {"items":[{"phrase":"...","translation":"...","pinyin":"...","blank":"...","answer":"...","options":["..."],"exampleSentence":"...","quizPrompt":"..."}]}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful language-learning content generator. Return compact JSON only.',
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
      return Array.isArray(parsed?.items) ? parsed.items : [];
    } catch (error) {
      this.logger.warn(`AI generation unavailable, falling back to local content. ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  private buildFallbackItems(category: string, difficulty: string, batchSize: number): GeneratedItem[] {
    const templates = [
      {
        phrase: `${category} starter`,
        translation: `A practical ${difficulty} phrase for ${category}`,
        pinyin: 'jiàn shì',
        blank: 'I am ___ for this lesson',
        answer: 'ready',
        options: ['ready', 'busy', 'late'],
        exampleSentence: `This is a useful example for ${category}.`,
        quizPrompt: `Choose the best translation for the phrase`,
      },
      {
        phrase: `${category} focus`,
        translation: `A focused ${difficulty} chunk for ${category}`,
        pinyin: 'zhǔ yì',
        blank: 'We should stay ___',
        answer: 'calm',
        options: ['calm', 'loud', 'fast'],
        exampleSentence: `We can use this in a ${category} conversation.`,
        quizPrompt: `Which answer best fits the blank?`,
      },
      {
        phrase: `${category} routine`,
        translation: `A repeatable ${difficulty} phrase for ${category}`,
        pinyin: 'cháng shǐ',
        blank: 'Let us ___ this task',
        answer: 'repeat',
        options: ['repeat', 'ignore', 'pause'],
        exampleSentence: `This phrase is great for daily ${category} practice.`,
        quizPrompt: `Pick the correct completion for the sentence`,
      },
    ];

    return Array.from({ length: batchSize }, (_, index) => {
      const template = templates[index % templates.length];
      return {
        phrase: `${template.phrase}-${index + 1}`,
        translation: template.translation,
        pinyin: template.pinyin,
        blank: template.blank,
        answer: template.answer,
        options: template.options,
        exampleSentence: template.exampleSentence,
        quizPrompt: template.quizPrompt,
      };
    });
  }
}
