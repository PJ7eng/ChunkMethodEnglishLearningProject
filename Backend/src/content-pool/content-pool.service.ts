import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class ContentPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async getChunks(category?: string): Promise<ChunkResponse[]> {
    const chunks = await this.prisma.chunk.findMany({
      where: category ? { category } : undefined,
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
    }));
  }

  async getRandomChunk(category?: string): Promise<ChunkResponse> {
    const chunks = await this.getChunks(category);
    if (chunks.length === 0) {
      throw new Error('No chunks found');
    }

    const randomIndex = Math.floor(Math.random() * chunks.length);
    return chunks[randomIndex];
  }
}
