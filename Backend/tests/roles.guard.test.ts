import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../src/auth/roles.guard';

function contextFor(user?: { sub: string; role: UserRole }) {
  const request = { user };
  return {
    request,
    context: {
      getHandler: () => 'handler',
      getClass: () => 'controller',
      switchToHttp: () => ({ getRequest: () => request }),
    },
  };
}

test('Admin RBAC rejects anonymous and learner requests', async () => {
  const reflector = {
    getAllAndOverride: () => [UserRole.content_admin, UserRole.super_admin],
  };
  const prisma = {
    user: {
      findUnique: async () => ({ role: UserRole.learner }),
    },
  };
  const guard = new RolesGuard(reflector as any, prisma as any);

  await assert.rejects(
    guard.canActivate(contextFor().context as any),
    ForbiddenException,
  );
  await assert.rejects(
    guard.canActivate(
      contextFor({ sub: 'learner-1', role: UserRole.learner }).context as any,
    ),
    /Insufficient role/,
  );
});

test('Admin RBAC reloads the persisted role before allowing access', async () => {
  const reflector = {
    getAllAndOverride: () => [UserRole.content_admin, UserRole.super_admin],
  };
  const prisma = {
    user: {
      findUnique: async () => ({ role: UserRole.super_admin }),
    },
  };
  const guard = new RolesGuard(reflector as any, prisma as any);
  const fixture = contextFor({
    sub: 'admin-1',
    role: UserRole.learner,
  });

  assert.equal(await guard.canActivate(fixture.context as any), true);
  assert.equal(fixture.request.user?.role, UserRole.super_admin);
});
