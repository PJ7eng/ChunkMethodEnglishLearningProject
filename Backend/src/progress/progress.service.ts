import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordAnswerDto {
  userId: string;
  chunkId: string;
  isCorrect: boolean;
  date?: Date;
  responseMs?: number;
}

function dayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAnswer(
    dto: RecordAnswerDto,
  ): Promise<{ mastered: boolean; answerCount: number; reviewCount: number; needsReview: boolean }> {
    const existing = await this.prisma.learningProgress.findUnique({
      where: { userId_chunkId: { userId: dto.userId, chunkId: dto.chunkId } },
    });

    const now = new Date();
    const previousStability = existing?.stability ?? 0;
    const previousDifficulty = existing?.difficulty ?? 5;
    const stability = dto.isCorrect
      ? Math.max(1, previousStability === 0 ? 1 : previousStability * 1.8)
      : Math.max(0.2, previousStability * 0.35);
    const difficulty = Math.min(
      10,
      Math.max(1, previousDifficulty + (dto.isCorrect ? -0.2 : 0.8)),
    );
    const intervalMs = dto.isCorrect
      ? Math.min(180, Math.max(1, Math.round(stability))) * 24 * 60 * 60 * 1000
      : 10 * 60 * 1000;
    const dueAt = new Date(now.getTime() + intervalMs);
    const nextMasteryScore = Math.min(1, stability / 30);
    const shouldMaster = stability >= 21;
    const needsReview = !dto.isCorrect;

    const progress = await this.prisma.learningProgress.upsert({
      where: { userId_chunkId: { userId: dto.userId, chunkId: dto.chunkId } },
      create: {
        userId: dto.userId,
        chunkId: dto.chunkId,
        answerCount: 1,
        reviewCount: dto.isCorrect ? 0 : 1,
        mastered: shouldMaster,
        needsReview,
        masteryScore: nextMasteryScore,
        stability,
        difficulty,
        dueAt,
        lapseCount: dto.isCorrect ? 0 : 1,
        lastResponseMs: dto.responseMs,
        lastReviewedAt: now,
      },
      update: {
        answerCount: { increment: 1 },
        masteryScore: nextMasteryScore,
        stability,
        difficulty,
        dueAt,
        mastered: shouldMaster,
        needsReview,
        reviewCount: { increment: dto.isCorrect ? 0 : 1 },
        lapseCount: { increment: dto.isCorrect ? 0 : 1 },
        lastResponseMs: dto.responseMs,
        lastReviewedAt: now,
      },
    });

    const prefs = await this.prisma.userPreference.findUnique({
      where: { userId: dto.userId },
    });
    const goal = prefs?.dailyGoal ?? 10;
    const start = dayStart(dto.date ? new Date(dto.date) : new Date());

    const existingDay = await this.prisma.dailyProgress.findUnique({
      where: { userId_date: { userId: dto.userId, date: start } },
    });

    await this.prisma.dailyProgress.upsert({
      where: { userId_date: { userId: dto.userId, date: start } },
      create: {
        userId: dto.userId,
        date: start,
        completedCount: 1,
        goal,
        streakDay: 0,
      },
      update: {
        completedCount: { increment: 1 },
        goal,
      },
    });

    const streak = await this.computeCurrentStreak(dto.userId);
    await this.prisma.dailyProgress.update({
      where: { userId_date: { userId: dto.userId, date: start } },
      data: { streakDay: streak },
    });

    void existingDay;

    return {
      mastered: progress.mastered,
      answerCount: progress.answerCount,
      reviewCount: progress.reviewCount,
      needsReview: progress.needsReview,
    };
  }

  async getToday(userId: string) {
    const prefs = await this.prisma.userPreference.findUnique({ where: { userId } });
    const goal = prefs?.dailyGoal ?? 10;
    const start = dayStart(new Date());
    const today = await this.prisma.dailyProgress.findUnique({
      where: { userId_date: { userId, date: start } },
    });
    const streak = await this.computeCurrentStreak(userId);

    return {
      completedCount: today?.completedCount ?? 0,
      goal: today?.goal ?? goal,
      streak,
      date: dateKey(start),
    };
  }

  async getStreak(userId: string) {
    const today = dayStart(new Date());
    const currentStreak = await this.computeCurrentStreak(userId);

    const allDays = await this.prisma.dailyProgress.findMany({
      where: { userId, completedCount: { gt: 0 } },
      orderBy: { date: 'asc' },
      select: { date: true, completedCount: true },
    });

    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const row of allDays) {
      const d = dayStart(row.date);
      if (prev) {
        const diff = (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekData = [];
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = dateKey(d);
      const found = allDays.find((x) => dateKey(dayStart(x.date)) === key);
      weekData.push({
        day: labels[i],
        done: (found?.completedCount ?? 0) > 0 && d <= today,
        count: found?.completedCount ?? 0,
        date: key,
      });
    }

    return {
      currentStreak,
      longestStreak: Math.max(longest, currentStreak),
      totalPracticedDays: allDays.length,
      weekData,
    };
  }

  async getCalendar(userId: string, year: number, month: number) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const rows = await this.prisma.dailyProgress.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        completedCount: { gt: 0 },
      },
      select: { date: true, completedCount: true },
    });

    return {
      year,
      month,
      days: rows.map((r) => ({
        date: dateKey(dayStart(r.date)),
        completedCount: r.completedCount,
      })),
    };
  }

  async getLearningMap(userId: string) {
    const rows = await this.prisma.learningProgress.findMany({
      where: { userId },
      include: { chunk: { include: { examples: true } } },
    });

    return rows.map((r) => ({
      chunkId: r.chunkId,
      mastered: r.mastered,
      needsReview: r.needsReview,
      answerCount: r.answerCount,
      reviewCount: r.reviewCount,
      masteryScore: r.masteryScore,
      lastReviewedAt: r.lastReviewedAt,
      chunk: this.mapChunk(r.chunk, r.needsReview, r.mastered),
    }));
  }

  async getReviewQueue(userId: string) {
    const rows = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        answerCount: { gt: 0 },
        dueAt: { lte: new Date() },
      },
      include: { chunk: { include: { examples: true } } },
      orderBy: { dueAt: 'asc' },
      take: 50,
    });

    return rows.map((r) => this.mapChunk(r.chunk, r.needsReview, r.mastered));
  }

  async getCategoryStats(userId: string) {
    const progress = await this.prisma.learningProgress.findMany({
      where: { userId },
      include: { chunk: { select: { category: true } } },
    });

    const learned = new Map<string, number>();
    const mastered = new Map<string, number>();
    const review = new Map<string, number>();

    for (const row of progress) {
      const cat = row.chunk.category;
      learned.set(cat, (learned.get(cat) || 0) + 1);
      if (row.mastered) mastered.set(cat, (mastered.get(cat) || 0) + 1);
      if (row.needsReview) review.set(cat, (review.get(cat) || 0) + 1);
    }

    const toSlices = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([id, value]) => ({ id, value }));

    return {
      learned: toSlices(learned),
      mastered: toSlices(mastered),
      needsReview: toSlices(review),
      totals: {
        learned: progress.length,
        mastered: progress.filter((p) => p.mastered).length,
        needsReview: progress.filter((p) => p.needsReview).length,
      },
    };
  }

  private mapChunk(
    chunk: {
      id: string;
      phrase: string;
      translation: string;
      pinyin: string | null;
      category: string;
      options: unknown;
      answer: string;
      blank: string;
      examples: { sentence: string }[];
    },
    needsReview: boolean,
    mastered: boolean,
  ) {
    return {
      id: chunk.id,
      phrase: chunk.phrase,
      translation: chunk.translation,
      pinyin: chunk.pinyin ?? '',
      category: chunk.category,
      options: Array.isArray(chunk.options) ? (chunk.options as string[]) : [],
      answer: chunk.answer,
      examples: chunk.examples.map((e) => e.sentence),
      blank: chunk.blank,
      needsReview,
      mastered,
    };
  }

  private async computeCurrentStreak(userId: string): Promise<number> {
    let streak = 0;
    const cursor = dayStart(new Date());

    for (let i = 0; i < 400; i++) {
      const row = await this.prisma.dailyProgress.findUnique({
        where: { userId_date: { userId, date: cursor } },
      });
      if (!row || row.completedCount <= 0) {
        if (i === 0) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }
}
