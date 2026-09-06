import assert from 'node:assert/strict';
import test from 'node:test';
import { GenerationService } from '../src/generation/generation.service';

class GenerationPrisma {
  updates: any[] = [];
  createdChunks = 0;
  generationJob = {
    create: async (args: any) => ({ id: 'job-1', ...args.data }),
    update: async (args: any) => {
      this.updates.push(args);
      return { id: 'job-1', ...args.data };
    },
    findUnique: async () => null,
    findMany: async () => [],
    count: async () => 0,
  };
  contentPoolItem = {
    create: async (args: any) => ({ id: 'pool-1', ...args.data }),
    update: async (args: any) => ({ id: 'pool-1', ...args.data }),
    deleteMany: async () => ({ count: 1 }),
  };
  chunk = {
    findMany: async () => [],
    create: async (args: any) => {
      this.createdChunks += 1;
      return { id: `chunk-${this.createdChunks}`, ...args.data };
    },
    count: async () => this.createdChunks,
  };
  chunkExample = {
    createMany: async (args: any) => ({ count: args.data.length }),
  };
  quizQuestion = {
    create: async (args: any) => ({ id: 'quiz-1', ...args.data }),
  };
}

const generationResult = (items: any[]) => ({
  provider: 'test',
  model: 'fake-model',
  inputTokens: 10,
  outputTokens: 20,
  retryCount: 0,
  items,
});

const generatedItem = {
  phrase: 'check in',
  translation: '辦理登記',
  blank: 'We need to ___ at the hotel.',
  answer: 'check in',
  options: ['check in', 'check out', 'turn in'],
  examples: [
    { sentence: 'We can check in after three.', translation: '我們三點後可入住。' },
    { sentence: 'They check in at noon.', translation: '他們中午入住。' },
  ],
  quizPrompt: 'Complete the sentence.',
  usage: 'Used when arriving at a hotel.',
  register: 'neutral',
  cefr: 'A2',
};

test('Generation flow persists reviewed content and usage metadata', async () => {
  const prisma = new GenerationPrisma();
  const service = new GenerationService(prisma as any);
  (service as any).generateItems = async () =>
    generationResult([generatedItem]);

  const job = await service.createAndRunJob({
    category: 'travel',
    difficulty: 'easy',
    batchSize: 1,
    triggerReason: 'manual',
  });

  assert.equal(job.status, 'success');
  assert.equal(job.generatedCount, 1);
  const success = prisma.updates.find((call) => call.data.status === 'success');
  assert.equal(success.data.provider, 'test');
  assert.equal(success.data.inputTokens, 10);
});

test('Generation flow validates jobs before persistence', async () => {
  const service = new GenerationService(new GenerationPrisma() as any);
  await assert.rejects(
    service.createJob({
      category: 'unsupported',
      difficulty: 'easy',
      batchSize: 1,
      triggerReason: 'manual',
    }),
    /Unsupported category/,
  );
  await assert.rejects(
    service.createJob({
      category: 'travel',
      difficulty: 'easy',
      batchSize: 51,
      triggerReason: 'manual',
    }),
    /batchSize must be between 1 and 50/,
  );
});

test('Generation flow records failure and cleans partial content', async () => {
  const prisma = new GenerationPrisma();
  const service = new GenerationService(prisma as any);
  (service as any).generateItems = async () => generationResult([]);

  await assert.rejects(
    service.createAndRunJob({
      category: 'travel',
      difficulty: 'easy',
      batchSize: 1,
      triggerReason: 'manual',
    }),
    /no new globally unique content/,
  );
  assert.ok(prisma.updates.some((call) => call.data.status === 'failed'));
});
