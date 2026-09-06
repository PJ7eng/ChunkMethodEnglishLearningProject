import assert from 'node:assert/strict';
import test from 'node:test';
import { AdminService } from '../src/admin/admin.service';

function pendingItem() {
  return {
    id: 'content-1',
    category: 'travel',
    difficulty: 'easy',
    status: 'pending_review',
    chunks: [
      {
        id: 'chunk-1',
        phrase: 'check in',
        translation: '辦理登記',
        usage: 'Used when arriving.',
        register: 'neutral',
        cefr: 'A2',
        blank: 'We need to ___ now.',
        answer: 'check in',
        options: ['check in', 'check out', 'turn in'],
        examples: [
          { sentence: 'We can check in now.' },
          { sentence: 'They check in at three.' },
        ],
      },
    ],
    quizzes: [],
    versions: [],
    generationJob: null,
  };
}

test('Admin approval creates a version and an audit event', async () => {
  const item = pendingItem();
  const createdVersions: any[] = [];
  const auditEvents: any[] = [];
  const tx = {
    contentVersion: {
      count: async () => 1,
      create: async ({ data }: any) => {
        createdVersions.push(data);
        return data;
      },
    },
    contentPoolItem: {
      update: async ({ data }: any) => ({ ...item, ...data }),
    },
    auditEvent: {
      create: async ({ data }: any) => {
        auditEvents.push(data);
        return data;
      },
    },
  };
  const prisma = {
    contentPoolItem: {
      findUnique: async () => item,
    },
    $transaction: async (callback: any) => callback(tx),
  };

  const result = await new AdminService(prisma as any).transition(
    item.id,
    'approve',
    'reviewer-1',
  );

  assert.equal(result.status, 'published');
  assert.equal(createdVersions[0].version, 2);
  assert.equal(createdVersions[0].createdById, 'reviewer-1');
  assert.equal(auditEvents[0].action, 'content.approve');
});

test('Admin transition rejects invalid workflow changes', async () => {
  const item = { ...pendingItem(), status: 'published' };
  const service = new AdminService({
    contentPoolItem: { findUnique: async () => item },
  } as any);

  await assert.rejects(
    service.transition(item.id, 'approve', 'reviewer-1'),
    /Cannot approve content in published/,
  );
});

test('Admin dashboard aggregates content and generation flow counts', async () => {
  const countCalls: any[] = [];
  const service = new AdminService({
    user: { count: async () => 7 },
    contentPoolItem: {
      count: async (args: any) => {
        countCalls.push(args);
        const counts: Record<string, number> = {
          pending_review: 3,
          published: 12,
          rejected: 4,
          retired: 2,
        };
        return counts[args.where.status] ?? 0;
      },
    },
    generationJob: {
      count: async () => 1,
      findMany: async () => [{ id: 'job-1', status: 'failed' }],
    },
  } as any);

  assert.deepEqual(await service.dashboard(), {
    users: 7,
    pending: 3,
    published: 12,
    rejected: 4,
    retired: 2,
    failedJobs: 1,
    recentJobs: [{ id: 'job-1', status: 'failed' }],
  });
  assert.equal(countCalls.length, 4);
});
