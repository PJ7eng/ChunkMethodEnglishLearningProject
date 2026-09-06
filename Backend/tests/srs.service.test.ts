import assert from 'node:assert/strict';
import test from 'node:test';
import { ProgressService } from '../src/progress/progress.service';

function srsFixture(existing: any, nowDayCount = 1) {
  let learningArgs: any;
  const prisma = {
    learningProgress: {
      findUnique: async () => existing,
      upsert: async (args: any) => {
        learningArgs = args;
        return {
          id: 'progress-1',
          ...existing,
          ...args.update,
          answerCount: (existing?.answerCount ?? 0) + 1,
          reviewCount:
            (existing?.reviewCount ?? 0) +
            (args.update.reviewCount.increment ?? 0),
          mastered: args.update.mastered,
          needsReview: args.update.needsReview,
        };
      },
    },
    dailyProgress: {
      findUnique: async () =>
        nowDayCount-- > 0 ? { completedCount: 1 } : null,
      upsert: async () => ({}),
      update: async () => ({}),
    },
    userPreference: {
      findUnique: async () => ({ dailyGoal: 10 }),
    },
  };
  return {
    service: new ProgressService(prisma as any),
    get learningArgs() {
      return learningArgs;
    },
  };
}

test('SRS correct answers increase stability and can mark a chunk mastered', async () => {
  const fixture = srsFixture({
    answerCount: 8,
    reviewCount: 2,
    stability: 20,
    difficulty: 4,
  });
  const before = Date.now();

  const result = await fixture.service.recordAnswer({
    userId: 'user-1',
    chunkId: 'chunk-1',
    isCorrect: true,
    responseMs: 900,
  });

  assert.equal(result.mastered, true);
  assert.equal(result.needsReview, false);
  assert.equal(fixture.learningArgs.update.stability, 36);
  assert.equal(fixture.learningArgs.update.difficulty, 3.8);
  assert.equal(fixture.learningArgs.update.lastResponseMs, 900);
  assert.ok(
    fixture.learningArgs.update.dueAt.getTime() >=
      before + 35 * 24 * 60 * 60 * 1000,
  );
});

test('SRS lapse schedules a short retry and increments review counters', async () => {
  const fixture = srsFixture({
    answerCount: 3,
    reviewCount: 0,
    stability: 10,
    difficulty: 5,
  });
  const before = Date.now();

  const result = await fixture.service.recordAnswer({
    userId: 'user-1',
    chunkId: 'chunk-1',
    isCorrect: false,
  });

  assert.equal(result.needsReview, true);
  assert.equal(result.reviewCount, 1);
  assert.equal(fixture.learningArgs.update.lapseCount.increment, 1);
  const dueIn = fixture.learningArgs.update.dueAt.getTime() - before;
  assert.ok(dueIn >= 9 * 60 * 1000 && dueIn <= 11 * 60 * 1000);
});

test('review queue only asks Prisma for due answered chunks', async () => {
  let query: any;
  const chunk = {
    id: 'chunk-1',
    phrase: 'check in',
    translation: '辦理登記',
    pinyin: null,
    category: 'travel',
    options: ['check in', 'check out', 'turn in'],
    answer: 'check in',
    blank: 'We need to ___ now.',
    examples: [{ sentence: 'We can check in at three.' }],
  };
  const service = new ProgressService({
    learningProgress: {
      findMany: async (args: any) => {
        query = args;
        return [
          { chunk, needsReview: true, mastered: false },
        ];
      },
    },
  } as any);

  const result = await service.getReviewQueue('user-1');

  assert.equal(query.where.userId, 'user-1');
  assert.deepEqual(query.where.answerCount, { gt: 0 });
  assert.ok(query.where.dueAt.lte instanceof Date);
  assert.equal(query.take, 50);
  assert.equal(result[0].phrase, 'check in');
  assert.equal(result[0].needsReview, true);
});
