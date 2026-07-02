import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

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
        };
      },
    },
    userPreference: {
      create: async ({ data }: { data: any }) => ({ id: 'pref-1', ...data }),
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
