import { beforeEach, describe, expect, it, vi } from "vitest";

const values = new Map<string, string>();

type PluginMethod = (...args: unknown[]) => Promise<unknown>;
const impl: Record<string, PluginMethod> = {};

function createCapacitorPluginProxy() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        return (...args: unknown[]) => {
          const method = impl[prop];
          if (!method) {
            return Promise.reject(
              new Error(`"${prop}()" is not implemented on android`),
            );
          }
          return method(...args);
        };
      },
    },
  );
}

vi.mock("@aparajita/capacitor-secure-storage", () => ({
  SecureStorage: createCapacitorPluginProxy(),
}));

const { keystoreRefreshStore } = await import("./secureRefreshStore");

describe("keystoreRefreshStore", () => {
  beforeEach(() => {
    values.clear();
    impl.setKeyPrefix = async () => undefined;
    impl.getItem = async (key) => values.get(String(key)) ?? null;
    impl.setItem = async (key, value) => {
      values.set(String(key), String(value));
    };
    impl.removeItem = async (key) => {
      values.delete(String(key));
    };
  });

  it("stores and clears the refresh token via plugin methods, not by awaiting the plugin object", async () => {
    await keystoreRefreshStore.set("refresh-secret");
    expect(await keystoreRefreshStore.get()).toBe("refresh-secret");
    await keystoreRefreshStore.clear();
    expect(await keystoreRefreshStore.get()).toBeNull();
  });

  it("returns null when Keystore read fails instead of hanging boot", async () => {
    impl.getItem = async () => {
      throw new Error('"getItem()" is not implemented on android');
    };
    await expect(keystoreRefreshStore.get()).resolves.toBeNull();
  });
});
