export type NativeBackAuthMode = "login" | "register";

export type NativeBackInput = {
  overlay: string | null;
  tab: string;
  isLoggedIn: boolean;
  authMode: NativeBackAuthMode;
  isAdminPath: boolean;
};

export type NativeBackAction =
  | { type: "close-admin" }
  | { type: "close-overlay" }
  | { type: "switch-auth"; mode: "login" }
  | { type: "go-home" }
  | { type: "leave-app" };

export function resolveNativeBackAction(
  input: NativeBackInput,
): NativeBackAction {
  if (input.isAdminPath) return { type: "close-admin" };
  if (input.overlay) return { type: "close-overlay" };
  if (!input.isLoggedIn) {
    if (input.authMode === "register") {
      return { type: "switch-auth", mode: "login" };
    }
    return { type: "leave-app" };
  }
  if (input.tab !== "home") return { type: "go-home" };
  return { type: "leave-app" };
}
