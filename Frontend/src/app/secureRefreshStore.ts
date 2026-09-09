import { SecureStorage } from "@aparajita/capacitor-secure-storage";

export interface SecureRefreshStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

const PREFIX = "chunkmaster_";
const REFRESH_KEY = "refresh";
const PLUGIN_TIMEOUT_MS = 4000;

let prefixReady: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("secure-storage-timeout"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function ensurePrefix(): Promise<void> {
  prefixReady ??= SecureStorage.setKeyPrefix(PREFIX);
  await withTimeout(prefixReady, PLUGIN_TIMEOUT_MS);
}

/**
 * Android Keystore-backed AES-GCM store. Static import so Capacitor can
 * register the native plugin at startup; a dynamic import can hang forever
 * waiting for a native callback that never arrives.
 *
 * Never return `SecureStorage` from an async function and never `await` the
 * plugin object. Capacitor's plugin proxy intercepts `.then`, so Promise
 * unwrapping calls `SecureStorage.then()`, which is not implemented on
 * Android and leaves the app stuck on Loading...
 *
 * Never call this store on web (the plugin's web adapter is localStorage).
 */
export const keystoreRefreshStore: SecureRefreshStore = {
  async get() {
    try {
      await ensurePrefix();
      const value = await withTimeout(
        SecureStorage.getItem(REFRESH_KEY),
        PLUGIN_TIMEOUT_MS,
      );
      return typeof value === "string" && value.length > 0 ? value : null;
    } catch {
      return null;
    }
  },
  async set(token: string) {
    await ensurePrefix();
    await withTimeout(
      SecureStorage.setItem(REFRESH_KEY, token),
      PLUGIN_TIMEOUT_MS,
    );
  },
  async clear() {
    try {
      await ensurePrefix();
      await withTimeout(
        SecureStorage.removeItem(REFRESH_KEY),
        PLUGIN_TIMEOUT_MS,
      );
    } catch {
      // Missing key or a timed-out plugin must not block logout / boot.
    }
  },
};
