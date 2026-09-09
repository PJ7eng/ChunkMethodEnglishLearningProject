import { describe, expect, it } from "vitest";
import { resolveNativeBackAction } from "./nativeBackButton";

const base = {
  overlay: null,
  tab: "home",
  isLoggedIn: true,
  authMode: "login" as const,
  isAdminPath: false,
};

describe("resolveNativeBackAction", () => {
  it("closes admin before other navigation", () => {
    expect(
      resolveNativeBackAction({ ...base, isAdminPath: true, overlay: "settings" }),
    ).toEqual({ type: "close-admin" });
  });

  it("closes an overlay instead of leaving the app", () => {
    expect(
      resolveNativeBackAction({ ...base, overlay: "review" }),
    ).toEqual({ type: "close-overlay" });
  });

  it("returns from notes or profile to home", () => {
    expect(resolveNativeBackAction({ ...base, tab: "notes" })).toEqual({
      type: "go-home",
    });
    expect(resolveNativeBackAction({ ...base, tab: "profile" })).toEqual({
      type: "go-home",
    });
  });

  it("leaves the app from home when logged in", () => {
    expect(resolveNativeBackAction(base)).toEqual({ type: "leave-app" });
  });

  it("returns register to login, then leaves from login", () => {
    expect(
      resolveNativeBackAction({
        ...base,
        isLoggedIn: false,
        authMode: "register",
      }),
    ).toEqual({ type: "switch-auth", mode: "login" });
    expect(
      resolveNativeBackAction({
        ...base,
        isLoggedIn: false,
        authMode: "login",
      }),
    ).toEqual({ type: "leave-app" });
  });
});
