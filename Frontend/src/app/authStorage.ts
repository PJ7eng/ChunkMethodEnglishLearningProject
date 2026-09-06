import type { AuthUser } from "./api";
import { isNativePlatform } from "./platform";

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

const webAuthStorage: AuthStorage = {
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
  async setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

let nativeAccessToken: string | null = null;
let nativeRefreshToken: string | null = null;
let nativeUser: AuthUser | null = null;

/**
 * Safe pre-Capacitor boundary. Credentials are memory-only until an Android
 * Keystore-backed implementation is injected; refresh tokens never fall back
 * to localStorage or Preferences.
 */
const nativeAuthStorageStub: AuthStorage = {
  async getAccessToken() {
    return nativeAccessToken;
  },
  async getRefreshToken() {
    return nativeRefreshToken;
  },
  async getUser() {
    return nativeUser;
  },
  async setSession(session) {
    nativeAccessToken = session.accessToken;
    nativeRefreshToken = session.refreshToken ?? null;
    nativeUser = session.user;
  },
  async setAccessToken(token) {
    nativeAccessToken = token;
  },
  async setUser(user) {
    nativeUser = user;
  },
  async clear() {
    nativeAccessToken = null;
    nativeRefreshToken = null;
    nativeUser = null;
  },
};

export const authStorage: AuthStorage = isNativePlatform
  ? nativeAuthStorageStub
  : webAuthStorage;
