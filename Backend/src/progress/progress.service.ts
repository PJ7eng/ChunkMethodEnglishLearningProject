import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordAnswerDto {
  userId: string;
  chunkId: string;
  isCorrect: boolean;
  date?: Date;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAnswer(dto: RecordAnswerDto): Promise<{ mastered: boolean; answerCount: number; reviewCount: number }> {
    const existing = await this.prisma.learningProgress.findUnique({
      where: { userId_chunkId: { userId: dto.userId, chunkId: dto.chunkId } },
    });

    const nextMasteryScore = Math.min(1, (existing?.masteryScore ?? 0) + (dto.isCorrect ? 0.25 : 0));
    const shouldMaster = nextMasteryScore >= 0.75 || dto.isCorrect;

    const progress = await this.prisma.learningProgress.upsert({
      where: { userId_chunkId: { userId: dto.userId, chunkId: dto.chunkId } },
      create: {
        userId: dto.userId,
        chunkId: dto.chunkId,
        answerCount: 1,
        reviewCount: dto.isCorrect ? 0 : 1,
        mastered: shouldMaster,
        needsReview: !dto.isCorrect,
        masteryScore: nextMasteryScore,
      },
      update: {
        answerCount: { increment: 1 },
        masteryScore: nextMasteryScore,
        mastered: shouldMaster,
        needsReview: !dto.isCorrect,
        reviewCount: { increment: dto.isCorrect ? 0 : 1 },
      },
    });

    const date = dto.date ? new Date(dto.date) : new Date();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    await this.prisma.dailyProgress.upsert({
      where: { userId_date: { userId: dto.userId, date: dayStart } },
      create: {
        userId: dto.userId,
        date: dayStart,
        completedCount: 1,
        goal: 10,
      },
      update: {
        completedCount: { increment: 1 },
      },
    });

    return {
      mastered: progress.mastered,
      answerCount: progress.answerCount,
      reviewCount: progress.reviewCount,
    };
  }
}
