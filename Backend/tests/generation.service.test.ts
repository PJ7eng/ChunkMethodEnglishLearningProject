import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationService } from '../src/generation/generation.service';

class FakePrisma {
  public generationJob: any;
  public contentPoolItem: any;
  public chunk: any;
  public chunkExample: any;
  public quizQuestion: any;
  public quizOption: any;

  constructor() {
    this.generationJob = {
      create: async (args: any) => ({ id: 'job-1', ...args.data }),
      update: async (args: any) => ({ id: 'job-1', ...args.data }),
      findUnique: async () => null,
      findMany: async () => [],
    };
    this.contentPoolItem = {
      create: async (args: any) => ({ id: 'pool-1', ...args.data }),
      update: async (args: any) => ({ id: 'pool-1', ...args.data }),
    };
    this.chunk = {
      create: async (args: any) => ({ id: 'chunk-1', ...args.data }),
    };
    this.chunkExample = {
      create: async (args: any) => ({ id: 'example-1', ...args.data }),
    };
    this.quizQuestion = {
      create: async (args: any) => ({ id: 'quiz-1', ...args.data }),
    };
    this.quizOption = {
      create: async (args: any) => ({ id: 'option-1', ...args.data }),
    };
  }
}

test('creates a generation job and persists generated content', async () => {
  const prisma = new FakePrisma();
  const service = new GenerationService(prisma as any);

  const job = await service.createAndRunJob({ category: 'travel', difficulty: 'easy', batchSize: 2, triggerReason: 'manual' });

  assert.equal(job.status, 'success');
  assert.equal(job.batchSize, 2);
  assert.equal(job.generatedCount, 2);
});
