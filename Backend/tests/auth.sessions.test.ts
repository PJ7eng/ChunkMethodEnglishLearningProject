import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'crypto';
import { AuthService } from '../src/auth/auth.service';

const hashToken = (value: string) =>
  createHash('sha256').update(value).digest('hex');

function authFixture() {
  const sessions: any[] = [];
  const user = {
    id: 'user-1',
    email: 'learner@example.com',
    name: 'Learner',
    role: 'learner',
    emailVerifiedAt: new Date(),
    passwordHash: '',
    createdAt: new Date(),
  };
  const prisma = {
    user: {
      findUnique: async () => user,
    },
    userSession: {
      create: async ({ data }: any) => {
        const session = {
          id: `session-${sessions.length + 1}`,
          revokedAt: null,
          ...data,
        };
        sessions.push(session);
        return session;
      },
      findUnique: async ({ where }: any) => {
        const session = sessions.find(
          (candidate) =>
            candidate.refreshTokenHash === where.refreshTokenHash,
        );
        return session ? { ...session, user } : null;
      },
      update: async ({ where, data }: any) => {
        const session = sessions.find((candidate) => candidate.id === where.id);
        Object.assign(session, data);
        return session;
      },
      updateMany: async ({ where, data }: any) => {
        const matching = sessions.filter((session) => {
          if (where.userId && session.userId !== where.userId) return false;
          if (
            where.refreshTokenHash &&
            session.refreshTokenHash !== where.refreshTokenHash
          ) {
            return false;
          }
          return where.revokedAt === null ? session.revokedAt === null : true;
        });
        matching.forEach((session) => Object.assign(session, data));
        return { count: matching.length };
      },
    },
  };
  return {
    service: new AuthService(prisma as any),
    sessions,
    seedRefreshToken(refreshToken: string) {
      sessions.push({
        id: 'session-1',
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      });
    },
  };
}

test('refresh rotates a body-compatible token and rejects replay', async () => {
  const fixture = authFixture();
  fixture.seedRefreshToken('original-refresh-token');

  const rotated = await fixture.service.refresh('original-refresh-token', {
    userAgent: 'native-test',
    ipAddress: '127.0.0.1',
  });

  assert.ok(rotated.token);
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.refreshToken, 'original-refresh-token');
  assert.equal(fixture.sessions[0].revokedAt instanceof Date, true);
  assert.equal(fixture.sessions[1].userAgent, 'native-test');

  await assert.rejects(
    fixture.service.refresh('original-refresh-token'),
    /Invalid refresh token/,
  );
  assert.equal(
    fixture.sessions.every((session) => session.revokedAt instanceof Date),
    true,
    'replay revokes the rotated session family',
  );
  await assert.rejects(
    fixture.service.refresh(rotated.refreshToken),
    /Invalid refresh token/,
  );
});

test('logout revokes only the supplied refresh session and is idempotent', async () => {
  const fixture = authFixture();
  fixture.seedRefreshToken('logout-token');
  fixture.sessions.push({
    id: 'session-2',
    userId: 'user-1',
    refreshTokenHash: hashToken('other-token'),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
  });

  assert.deepEqual(await fixture.service.logout('logout-token'), {
    success: true,
  });
  assert.equal(fixture.sessions[0].revokedAt instanceof Date, true);
  assert.equal(fixture.sessions[1].revokedAt, null);
  assert.deepEqual(await fixture.service.logout('logout-token'), {
    success: true,
  });
  assert.deepEqual(await fixture.service.logout(), { success: true });
});
