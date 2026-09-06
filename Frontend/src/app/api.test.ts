import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTodayProgress,
  loginUser,
  validateEmail,
  validatePassword,
} from "./api";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

describe("frontend API contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("navigator", { onLine: true });
  });

  it("validates credentials before sending requests", () => {
    expect(validateEmail("")).toBe("Please enter your email.");
    expect(validateEmail("not-an-email")).toBe(
      "Please enter a valid email address.",
    );
    expect(validateEmail("learner@example.com")).toBeNull();
    expect(validatePassword("short")).toBe(
      "Password must be at least 8 characters.",
    );
    expect(validatePassword("secure-pass")).toBeNull();
  });

  it("normalizes login email and sends credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "ok",
          token: "access-token",
          user: { id: "user-1", email: "learner@example.com" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await loginUser(" Learner@Example.COM ", "secure-pass");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      email: "learner@example.com",
      password: "secure-pass",
    });
    expect(init.credentials).toBe("include");
  });

  it("refreshes once after 401, stores the token, and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            message: "refreshed",
            token: "rotated-access",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            completedCount: 2,
            goal: 10,
            streak: 1,
            date: "2026-08-17",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTodayProgress()).resolves.toMatchObject({
      completedCount: 2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(localStorage.getItem("chunk_auth_token")).toBe("rotated-access");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer rotated-access",
    );
  });

  it("reports offline state without sending a request", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTodayProgress()).rejects.toMatchObject({
      kind: "offline",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps fetch failures to a retryable network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));

    await expect(getTodayProgress()).rejects.toMatchObject({
      kind: "network",
    });
  });
});
