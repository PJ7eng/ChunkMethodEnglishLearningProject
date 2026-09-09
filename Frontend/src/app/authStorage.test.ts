import { beforeEach, describe, expect, it } from "vitest";
import { createNativeAuthStorage } from "./authStorage";
import type { SecureRefreshStore } from "./secureRefreshStore";

function memoryStore(): SecureRefreshStore {
  let value: string | null = null;
  return {
    async get() {
      return value;
    },
    async set(token) {
      value = token;
    },
    async clear() {
      value = null;
    },
  };
}

const user = { id: "user-1", email: "learner@example.com" };

describe("createNativeAuthStorage", () => {
  let store: SecureRefreshStore;

  beforeEach(() => {
    store = memoryStore();
  });

  it("keeps the access token in memory and the refresh token in the store", async () => {
    const storage = createNativeAuthStorage(store);
    await storage.setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user,
    });

    expect(await storage.getAccessToken()).toBe("access-1");
    expect(await storage.getRefreshToken()).toBe("refresh-1");
    expect(await store.get()).toBe("refresh-1");
  });

  it("survives a process restart: refresh remains, access and user do not", async () => {
    const first = createNativeAuthStorage(store);
    await first.setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user,
    });

    const restarted = createNativeAuthStorage(store);
    expect(await restarted.getAccessToken()).toBeNull();
    expect(await restarted.getUser()).toBeNull();
    expect(await restarted.getRefreshToken()).toBe("refresh-1");
  });

  it("clears memory and the store on logout", async () => {
    const storage = createNativeAuthStorage(store);
    await storage.setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user,
    });
    await storage.clear();

    expect(await storage.getAccessToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
    expect(await store.get()).toBeNull();
  });

  it("does not write an access token into the refresh store", async () => {
    const storage = createNativeAuthStorage(store);
    await storage.setSession({
      accessToken: "access-secret",
      refreshToken: "refresh-secret",
      user,
    });
    await storage.setAccessToken("rotated-access");

    expect(await store.get()).toBe("refresh-secret");
    expect(await storage.getAccessToken()).toBe("rotated-access");
  });

  it("clears stored refresh when a session has no refresh token", async () => {
    const storage = createNativeAuthStorage(store);
    await storage.setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user,
    });
    await storage.setSession({
      accessToken: "access-2",
      user,
    });

    expect(await store.get()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
  });
});
