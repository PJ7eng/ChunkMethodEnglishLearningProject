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
  (service as any).generateItems = async () => [
    {
      phrase: 'check in',
      translation: '辦理登記',
      blank: 'We need to ___ at the hotel.',
      answer: 'check in',
      options: ['check in', 'check out', 'turn in'],
      exampleSentence: 'We can check in after three.',
      quizPrompt: 'Complete the sentence.',
      usage: 'Used when arriving at a hotel.',
      register: 'neutral',
      cefr: 'A2',
    },
    {
      phrase: 'get around',
      translation: '四處移動',
      blank: 'The metro helps us ___ quickly.',
      answer: 'get around',
      options: ['get around', 'get away', 'get over'],
      exampleSentence: 'It is easy to get around by train.',
      quizPrompt: 'Complete the sentence.',
      usage: 'Used for transportation.',
      register: 'neutral',
      cefr: 'B1',
    },
  ];

  const job = await service.createAndRunJob({ category: 'travel', difficulty: 'easy', batchSize: 2, triggerReason: 'manual' });

  assert.equal(job.status, 'success');
  assert.equal(job.batchSize, 2);
  assert.equal(job.generatedCount, 2);
});
