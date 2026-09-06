import assert from 'node:assert/strict';
import test from 'node:test';
import { GenerationService } from '../src/generation/generation.service';

class FakePrisma {
  jobs: any[] = [];
  pools: any[] = [];
  chunks: any[] = [];
  examples: any[] = [];
  quizzes: any[] = [];
  deletedGeneratingPools = 0;

  generationJob = {
    create: async (args: any) => {
      const job = { id: `job-${this.jobs.length + 1}`, ...args.data };
      this.jobs.push(job);
      return job;
    },
    update: async (args: any) => {
      const job = this.jobs.find((value) => value.id === args.where.id) || { id: args.where.id };
      Object.assign(job, args.data);
      if (!this.jobs.includes(job)) this.jobs.push(job);
      return job;
    },
    findUnique: async () => null,
    findMany: async () => [],
    count: async () => 0,
  };

  contentPoolItem = {
    create: async (args: any) => {
      const pool = { id: `pool-${this.pools.length + 1}`, ...args.data };
      this.pools.push(pool);
      return pool;
    },
    update: async (args: any) => {
      const pool = this.pools.find((value) => value.id === args.where.id);
      Object.assign(pool, args.data);
      return pool;
    },
    deleteMany: async (args: any) => {
      const before = this.pools.length;
      this.pools = this.pools.filter((pool) => !(
        pool.generationJobId === args.where.generationJobId &&
        pool.status === args.where.status
      ));
      this.deletedGeneratingPools += before - this.pools.length;
      return { count: before - this.pools.length };
    },
  };

  chunk = {
    findMany: async (args: any) => this.chunks
      .filter((chunk) => args.where.phraseKey.in.includes(chunk.phraseKey))
      .map((chunk) => ({ phraseKey: chunk.phraseKey })),
    create: async (args: any) => {
      const chunk = { id: `chunk-${this.chunks.length + 1}`, ...args.data };
      this.chunks.push(chunk);
      return chunk;
    },
    count: async (args: any) => this.chunks.filter(
      (chunk) => chunk.contentPoolItemId === args.where.contentPoolItemId,
    ).length,
  };

  chunkExample = {
    createMany: async (args: any) => {
      this.examples.push(...args.data);
      return { count: args.data.length };
    },
  };

  quizQuestion = {
    create: async (args: any) => {
      const quiz = { id: `quiz-${this.quizzes.length + 1}`, ...args.data };
      this.quizzes.push(quiz);
      return quiz;
    },
  };
}

function mockItem(index: number) {
  const phrase = `travel phrase ${index}`;
  return {
    phrase,
    translation: `旅遊片語 ${index}`,
    blank: `We use ___ in example ${index}.`,
    answer: phrase,
    options: [phrase, `distractor ${index}-1`, `distractor ${index}-2`],
    examples: [
      { sentence: `This is the first ${phrase} example.`, translation: `第一個例句 ${index}` },
      { sentence: `This is the second ${phrase} example.`, translation: `第二個例句 ${index}` },
    ],
    quizPrompt: `Complete example ${index}.`,
    usage: 'Used in common travel situations.',
    register: 'neutral',
    cefr: 'A2',
  };
}

test('persists a 50-item mock AI batch with metadata, examples, tokens, and cost', async () => {
  const prisma = new FakePrisma();
  const service = new GenerationService(prisma as any);
  (service as any).generateItems = async () => ({
    items: Array.from({ length: 50 }, (_, index) => mockItem(index)),
    provider: 'mock-ai',
    model: 'mock-content-v1',
    inputTokens: 1_000,
    outputTokens: 4_000,
    retryCount: 1,
  });

  const previousInputRate = process.env.OPENAI_INPUT_COST_PER_MILLION;
  const previousOutputRate = process.env.OPENAI_OUTPUT_COST_PER_MILLION;
  process.env.OPENAI_INPUT_COST_PER_MILLION = '1';
  process.env.OPENAI_OUTPUT_COST_PER_MILLION = '2';
  try {
    const job = await service.createAndRunJob({
      category: 'travel',
      difficulty: 'easy',
      batchSize: 50,
      triggerReason: 'regression',
    });
    assert.equal(job.status, 'success');
    assert.equal(job.generatedCount, 50);
  } finally {
    if (previousInputRate === undefined) delete process.env.OPENAI_INPUT_COST_PER_MILLION;
    else process.env.OPENAI_INPUT_COST_PER_MILLION = previousInputRate;
    if (previousOutputRate === undefined) delete process.env.OPENAI_OUTPUT_COST_PER_MILLION;
    else process.env.OPENAI_OUTPUT_COST_PER_MILLION = previousOutputRate;
  }

  assert.equal(prisma.chunks.length, 50);
  assert.equal(prisma.examples.length, 100);
  assert.equal(prisma.jobs[0].model, 'mock-content-v1');
  assert.equal(prisma.jobs[0].inputTokens, 1_000);
  assert.equal(prisma.jobs[0].outputTokens, 4_000);
  assert.equal(prisma.jobs[0].estimatedCost, 0.009);
  assert.equal(prisma.jobs[0].retryCount, 1);
});

test('filters globally duplicated normalized phrases before persistence', async () => {
  const prisma = new FakePrisma();
  prisma.chunks.push({ id: 'existing', phraseKey: 'travel phrase 0', contentPoolItemId: 'old' });
  const service = new GenerationService(prisma as any);
  (service as any).generateItems = async () => ({
    items: [mockItem(0), mockItem(1)],
    provider: 'mock-ai',
    model: 'mock-content-v1',
    inputTokens: 10,
    outputTokens: 20,
    retryCount: 0,
  });

  const result = await service.createAndRunJob({
    category: 'travel',
    difficulty: 'easy',
    batchSize: 2,
    triggerReason: 'dedupe',
  });

  assert.equal(result.generatedCount, 1);
  assert.equal(prisma.chunks.filter((chunk) => chunk.phraseKey === 'travel phrase 0').length, 1);
});

test('cleans generating content when persistence fails', async () => {
  const prisma = new FakePrisma();
  const service = new GenerationService(prisma as any);
  (service as any).generateItems = async () => ({
    items: [mockItem(1)],
    provider: 'mock-ai',
    model: 'mock-content-v1',
    inputTokens: 10,
    outputTokens: 20,
    retryCount: 0,
  });
  prisma.quizQuestion.create = async () => {
    throw new Error('mock persistence failure');
  };

  await assert.rejects(
    service.createAndRunJob({
      category: 'travel',
      difficulty: 'easy',
      batchSize: 1,
      triggerReason: 'failure-cleanup',
    }),
    /mock persistence failure/,
  );
  assert.equal(prisma.deletedGeneratingPools, 1);
  assert.equal(prisma.jobs[0].status, 'failed');
});

test('limits retryable mock AI failures to the configured attempt count', async () => {
  const service = new GenerationService(new FakePrisma() as any);
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalAttempts = process.env.GENERATION_MAX_ATTEMPTS;
  let attempts = 0;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.GENERATION_MAX_ATTEMPTS = '2';
  global.fetch = async () => {
    attempts += 1;
    return new Response('{}', { status: 429 });
  };
  try {
    await assert.rejects(
      (service as any).tryGenerateWithAi('travel', 'easy', 1),
      /failed after 2 attempt/,
    );
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalAttempts === undefined) delete process.env.GENERATION_MAX_ATTEMPTS;
    else process.env.GENERATION_MAX_ATTEMPTS = originalAttempts;
  }
  assert.equal(attempts, 2);
});

test('DeepSeek generation requests json_object at the DeepSeek chat completions URL', async () => {
  const service = new GenerationService(new FakePrisma() as any);
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalBase = process.env.AI_BASE_URL;
  const originalModel = process.env.OPENAI_MODEL;
  const originalAiModel = process.env.AI_MODEL;
  const originalJsonMode = process.env.AI_JSON_MODE;
  let requestUrl = '';
  let requestBody: any;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://api.deepseek.com/chat/completions';
  process.env.OPENAI_MODEL = 'deepseek-v4-pro';
  delete process.env.AI_MODEL;
  delete process.env.AI_JSON_MODE;
  global.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    return new Response('{"error":"rate"}', { status: 429 });
  };
  try {
    await assert.rejects(
      (service as any).tryGenerateWithAi('travel', 'easy', 1),
      /AI request failed with 429/,
    );
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalBase === undefined) delete process.env.AI_BASE_URL;
    else process.env.AI_BASE_URL = originalBase;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
    if (originalAiModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = originalAiModel;
    if (originalJsonMode === undefined) delete process.env.AI_JSON_MODE;
    else process.env.AI_JSON_MODE = originalJsonMode;
  }
  assert.equal(requestUrl, 'https://api.deepseek.com/chat/completions');
  assert.equal(requestBody.model, 'deepseek-v4-pro');
  assert.equal(requestBody.response_format.type, 'json_object');
  assert.equal(requestBody.thinking, undefined);
  assert.match(requestBody.messages[1].content, /json/i);
});

test('OpenAI-compatible endpoints keep json_schema structured output', async () => {
  const service = new GenerationService(new FakePrisma() as any);
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalBase = process.env.AI_BASE_URL;
  const originalModel = process.env.OPENAI_MODEL;
  let requestBody: any;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://api.openai.com/v1/chat/completions';
  process.env.OPENAI_MODEL = 'gpt-4o-mini';
  global.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response('{"error":"rate"}', { status: 429 });
  };
  try {
    await assert.rejects(
      (service as any).tryGenerateWithAi('travel', 'easy', 1),
      /AI request failed with 429/,
    );
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalBase === undefined) delete process.env.AI_BASE_URL;
    else process.env.AI_BASE_URL = originalBase;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  }
  assert.equal(requestBody.response_format.type, 'json_schema');
  assert.equal(requestBody.model, 'gpt-4o-mini');
});

test('createJob allows the same category and difficulty twice in one day', async () => {
  const prisma = new FakePrisma();
  const service = new GenerationService(prisma as any);
  const dto = {
    category: 'travel',
    difficulty: 'easy',
    batchSize: 2,
    triggerReason: 'admin-v1-batch',
  };

  const first = await service.createJob(dto, 'user-1');
  const second = await service.createJob(dto, 'user-1');

  assert.notEqual(first.id, second.id);
  assert.equal(prisma.jobs.length, 2);
  assert.equal(prisma.jobs[0].category, 'travel');
  assert.equal(prisma.jobs[1].category, 'travel');
});

test('rejects unsupported generation jobs before persistence', async () => {
  const service = new GenerationService(new FakePrisma() as any);
  await assert.rejects(
    service.createJob({
      category: 'unsupported',
      difficulty: 'easy',
      batchSize: 2,
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
