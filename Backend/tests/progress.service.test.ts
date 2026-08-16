import test from 'node:test';
import assert from 'node:assert/strict';
import { ProgressService } from '../src/progress/progress.service';

class FakePrisma {
  public upserts: Array<any> = [];
  public learningProgress: any;
  public dailyProgress: any;
  public userPreference: any;

  constructor() {
    this.learningProgress = {
      findUnique: async () => null,
      upsert: async (args: any) => {
        this.upserts.push(args);
        return { id: 'progress-1', ...args.create };
      },
    };
    this.dailyProgress = {
      findUnique: async () => null,
      upsert: async (args: any) => {
        this.upserts.push(args);
        return { id: 'daily-1', ...args.create };
      },
      update: async (args: any) => ({ id: 'daily-1', ...args.data }),
    };
    this.userPreference = {
      findUnique: async () => ({ dailyGoal: 10 }),
    };
  }
}

test('records progress and updates daily completion count', async () => {
  const prisma = new FakePrisma();
  const service = new ProgressService(prisma as any);
  const result = await service.recordAnswer({ userId: 'user-1', chunkId: 'chunk-1', isCorrect: true, date: new Date('2026-01-01') });

  assert.equal(result.mastered, false);
  assert.equal(result.answerCount, 1);
  assert.equal(result.reviewCount, 0);
  assert.equal(prisma.upserts.length, 2);
});
