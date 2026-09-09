import type { AuthUser } from "./api";
import { isNativePlatform } from "./platform";
import {
  keystoreRefreshStore,
  type SecureRefreshStore,
} from "./secureRefreshStore";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface AuthStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  getUser(): Promise<AuthUser | null>;
  setSession(session: AuthSession): Promise<void>;
  setAccessToken(token: string): Promise<void>;
  setRefreshToken(token: string): Promise<void>;
  setUser(user: AuthUser): Promise<void>;
  clear(): Promise<void>;
}

const ACCESS_TOKEN_KEY = "chunk_auth_token";
const USER_KEY = "chunk_auth_user";

function parseStoredUser(value: string | null): AuthUser | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function createWebAuthStorage(): AuthStorage {
  return {
    async getAccessToken() {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    },
    async getRefreshToken() {
      // Web refresh credentials remain in the HttpOnly cookie.
      return null;
    },
    async getUser() {
      return parseStoredUser(localStorage.getItem(USER_KEY));
    },
    async setSession(session) {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    },
    async setAccessToken(token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },
    async setRefreshToken(_token: string) {
      // Web does not persist refresh tokens in JS storage.
    },
    async setUser(user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    async clear() {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  };
}

export function createNativeAuthStorage(store: SecureRefreshStore): AuthStorage {
  let accessToken: string | null = null;
  let user: AuthUser | null = null;
  let refreshCache: string | null | undefined;

  return {
    async getAccessToken() {
      return accessToken;
    },
    async getRefreshToken() {
      if (refreshCache === undefined) {
        refreshCache = await store.get();
      }
      return refreshCache;
    },
    async getUser() {
      return user;
    },
    async setSession(session) {
      accessToken = session.accessToken;
      user = session.user;
      if (session.refreshToken) {
        refreshCache = session.refreshToken;
        await store.set(session.refreshToken);
      } else {
        refreshCache = null;
        await store.clear();
      }
    },
    async setAccessToken(token) {
      accessToken = token;
    },
    async setRefreshToken(token) {
      refreshCache = token;
      await store.set(token);
    },
    async setUser(nextUser) {
      user = nextUser;
    },
    async clear() {
      accessToken = null;
      user = null;
      refreshCache = null;
      await store.clear();
    },
  };
}

export const authStorage: AuthStorage = isNativePlatform
  ? createNativeAuthStorage(keystoreRefreshStore)
  : createWebAuthStorage();
