import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

const hashToken = (value: string) =>
  createHash('sha256').update(value).digest('hex');

test('register hashes the password and stores a new user', async () => {
  const createdUsers: Array<{ email: string; passwordHash: string; name?: string | null }> = [];
  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }: { data: any }) => {
        createdUsers.push(data);
        return {
          id: 'user-1',
          email: data.email,
          name: data.name ?? null,
          createdAt: new Date(),
          passwordHash: data.passwordHash,
          role: 'learner',
          emailVerifiedAt: null,
        };
      },
    },
    emailVerificationToken: {
      create: async ({ data }: { data: any }) => ({ id: 'verify-1', ...data }),
    },
    userSession: {
      create: async ({ data }: { data: any }) => ({ id: 'session-1', ...data }),
    },
  };

  const authService = new AuthService(prisma as unknown as PrismaService);
  const result = await authService.register({
    email: 'demo@example.com',
    password: 'secret123',
    name: 'Demo',
  });

  assert.equal(result.success, true);
  assert.equal(createdUsers[0].email, 'demo@example.com');
  assert.notEqual(createdUsers[0].passwordHash, 'secret123');
  assert.equal(result.user.email, 'demo@example.com');
});

function verifyEmailFixture(options: {
  usedAt?: Date | null;
  emailVerifiedAt?: Date | null;
  expiresAt?: Date;
  missing?: boolean;
} = {}) {
  const user = {
    id: 'user-1',
    email: 'learner@example.com',
    name: 'Learner',
    role: 'learner',
    emailVerifiedAt: options.emailVerifiedAt ?? null,
  };
  const tokens: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    usedAt: Date | null;
    expiresAt: Date;
  }> = options.missing
    ? []
    : [
        {
          id: 'tok-1',
          userId: user.id,
          tokenHash: hashToken('valid-token'),
          usedAt: options.usedAt ?? null,
          expiresAt: options.expiresAt ?? new Date(Date.now() + 60_000),
        },
      ];

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email && where.email !== user.email) return null;
        if (where.id && where.id !== user.id) return null;
        return user;
      },
      update: async ({ data }: { data: { emailVerifiedAt?: Date } }) => {
        Object.assign(user, data);
        return user;
      },
    },
    emailVerificationToken: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const record = tokens.find((token) => token.tokenHash === where.tokenHash);
        return record ? { ...record, user } : null;
      },
      create: async ({ data }: { data: any }) => {
        const created = { id: `tok-${tokens.length + 1}`, usedAt: null, ...data };
        tokens.push(created);
        return created;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { usedAt: Date };
      }) => {
        const record = tokens.find((token) => token.id === where.id);
        if (!record) return null;
        Object.assign(record, data);
        return record;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          userId?: string;
          usedAt?: null;
          tokenHash?: { not: string };
        };
        data: { usedAt: Date };
      }) => {
        let count = 0;
        for (const record of tokens) {
          if (where.userId && record.userId !== where.userId) continue;
          if (where.usedAt === null && record.usedAt !== null) continue;
          if (where.tokenHash?.not && record.tokenHash === where.tokenHash.not) {
            continue;
          }
          Object.assign(record, data);
          count += 1;
        }
        return { count };
      },
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  };

  return {
    service: new AuthService(prisma as unknown as PrismaService),
    user,
    tokens,
  };
}

test('verifyEmail marks a fresh token as used and verifies the user', async () => {
  const fixture = verifyEmailFixture();
  const result = await fixture.service.verifyEmail('valid-token');
  assert.equal(result.success, true);
  assert.ok(fixture.user.emailVerifiedAt);
  assert.ok(fixture.tokens[0].usedAt);
});

test('verifyEmail is idempotent when the token was already used and the user is verified', async () => {
  const fixture = verifyEmailFixture({
    usedAt: new Date(),
    emailVerifiedAt: new Date(),
  });
  const result = await fixture.service.verifyEmail('valid-token');
  assert.equal(result.success, true);
  assert.equal(result.message, 'Email verified');
});

test('verifyEmail succeeds if the user is already verified but the token was unused', async () => {
  const fixture = verifyEmailFixture({
    emailVerifiedAt: new Date(),
  });
  const result = await fixture.service.verifyEmail('valid-token');
  assert.equal(result.success, true);
  assert.ok(fixture.tokens[0].usedAt);
});

test('verifyEmail rejects a used token when the user is still unverified', async () => {
  const fixture = verifyEmailFixture({ usedAt: new Date() });
  await assert.rejects(
    () => fixture.service.verifyEmail('valid-token'),
    BadRequestException,
  );
});

test('verifyEmail rejects an expired unused token', async () => {
  const fixture = verifyEmailFixture({
    expiresAt: new Date(Date.now() - 1000),
  });
  await assert.rejects(
    () => fixture.service.verifyEmail('valid-token'),
    BadRequestException,
  );
});

test('verifyEmail rejects an unknown token', async () => {
  const fixture = verifyEmailFixture({ missing: true });
  await assert.rejects(
    () => fixture.service.verifyEmail('valid-token'),
    BadRequestException,
  );
});

test('resendVerificationEmail issues a new token for an unverified user', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const fixture = verifyEmailFixture();
    const result = await fixture.service.resendVerificationEmail(
      'Learner@Example.com',
    );
    assert.equal(result.success, true);
    assert.equal(fixture.tokens.length, 2);
    assert.ok(fixture.tokens[0].usedAt);
    assert.equal(fixture.tokens[1].usedAt, null);
  } finally {
    if (previousKey !== undefined) process.env.RESEND_API_KEY = previousKey;
  }
});

test('resendVerificationEmail does not leak whether an account exists', async () => {
  const fixture = verifyEmailFixture();
  fixture.user.emailVerifiedAt = new Date();
  const verified = await fixture.service.resendVerificationEmail(
    'learner@example.com',
  );
  const missing = await fixture.service.resendVerificationEmail(
    'nobody@example.com',
  );
  assert.equal(verified.message, missing.message);
  assert.equal(fixture.tokens.length, 1);
});
