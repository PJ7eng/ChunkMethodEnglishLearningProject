import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChunkResponse {
  id: string;
  phrase: string;
  translation: string;
  pinyin?: string;
  category: string;
  difficulty: string;
  blank: string;
  answer: string;
  options: string[];
  examples: string[];
  needsReview?: boolean;
  mastered?: boolean;
}

@Injectable()
export class ContentPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async getChunks(category?: string): Promise<ChunkResponse[]> {
    const chunks = await this.prisma.chunk.findMany({
      where: {
        contentPoolItem: { status: 'published' },
        ...(category ? { category } : {}),
      },
      include: {
        examples: true,
      },
      orderBy: { phrase: 'asc' },
    });

    return chunks.map((chunk) => ({
      id: chunk.id,
      phrase: chunk.phrase,
      translation: chunk.translation,
      pinyin: chunk.pinyin ?? undefined,
      category: chunk.category,
      difficulty: chunk.difficulty,
      blank: chunk.blank,
      answer: chunk.answer,
      options: Array.isArray(chunk.options) ? (chunk.options as string[]) : [],
      examples: chunk.examples.map((example) => example.sentence),
      needsReview: false,
      mastered: false,
    }));
  }

  async getRandomChunk(category?: string): Promise<ChunkResponse> {
    const where = {
      contentPoolItem: { status: 'published' as const },
      ...(category ? { category } : {}),
    };
    const count = await this.prisma.chunk.count({ where });
    if (!count) throw new NotFoundException('No chunks found');
    const chunk = await this.prisma.chunk.findFirst({
      where,
      skip: Math.floor(Math.random() * count),
      include: { examples: true },
      orderBy: { id: 'asc' },
    });
    if (!chunk) throw new NotFoundException('No chunks found');
    return {
      id: chunk.id,
      phrase: chunk.phrase,
      translation: chunk.translation,
      pinyin: chunk.pinyin ?? undefined,
      category: chunk.category,
      difficulty: chunk.difficulty,
      blank: chunk.blank,
      answer: chunk.answer,
      options: Array.isArray(chunk.options) ? (chunk.options as string[]) : [],
      examples: chunk.examples.map((example) => example.sentence),
      needsReview: false,
      mastered: false,
    };
  }
}
