import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthController } from '../src/auth/auth.controller';

function responseFixture() {
  const cookies: any[] = [];
  const cleared: any[] = [];
  return {
    response: {
      cookie: (...args: any[]) => cookies.push(args),
      clearCookie: (...args: any[]) => cleared.push(args),
    },
    cookies,
    cleared,
  };
}

test('refresh accepts a request-body token and returns rotated cookies', async () => {
  const calls: any[] = [];
  const auth = {
    refresh: async (...args: any[]) => {
      calls.push(args);
      return {
        success: true,
        token: 'new-access',
        refreshToken: 'new-refresh',
      };
    },
  };
  const controller = new AuthController(auth as any);
  const { response, cookies } = responseFixture();

  await controller.refresh(
    { cookies: {}, headers: {}, ip: '127.0.0.1' } as any,
    response as any,
    { refreshToken: 'native-body-token' },
  );

  assert.equal(calls[0][0], 'native-body-token');
  assert.equal(cookies.length, 2);
  assert.equal(cookies[1][0], 'chunk_refresh_token');
  assert.equal(cookies[1][1], 'new-refresh');
});

test('logout accepts a body token and clears both session cookies', async () => {
  let receivedToken: string | undefined;
  const controller = new AuthController({
    logout: async (token?: string) => {
      receivedToken = token;
      return { success: true };
    },
  } as any);
  const { response, cleared } = responseFixture();

  const result = await controller.logout(
    { cookies: {}, headers: {} } as any,
    response as any,
    { refreshToken: 'native-logout-token' },
  );

  assert.equal(receivedToken, 'native-logout-token');
  assert.deepEqual(result, { success: true });
  assert.deepEqual(
    cleared.map(([name]) => name),
    ['chunk_access_token', 'chunk_refresh_token'],
  );
});
