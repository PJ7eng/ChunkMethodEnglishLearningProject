import { useEffect } from "react";
import { App } from "@capacitor/app";
import { isNativePlatform } from "./platform";
import {
  resolveNativeBackAction,
  type NativeBackAuthMode,
} from "./nativeBackButton";

type OverlayId =
  | "streak"
  | "mastered"
  | "challenge"
  | "library"
  | "settings"
  | "review"
  | null;

type TabId = "home" | "notes" | "profile";

export function useNativeBackButton(options: {
  overlay: OverlayId;
  setOverlay: (overlay: OverlayId) => void;
  tab: TabId;
  setTab: (tab: TabId) => void;
  isLoggedIn: boolean;
  authMode: NativeBackAuthMode;
  setAuthMode: (mode: NativeBackAuthMode) => void;
  isAdminPath: boolean;
  setIsAdminPath: (value: boolean) => void;
}): void {
  const {
    overlay,
    setOverlay,
    tab,
    setTab,
    isLoggedIn,
    authMode,
    setAuthMode,
    isAdminPath,
    setIsAdminPath,
  } = options;

  useEffect(() => {
    if (!isNativePlatform) return;

    let cancelled = false;
    let handle: { remove: () => Promise<void> } | undefined;

    void App.addListener("backButton", ({ canGoBack }) => {
      const action = resolveNativeBackAction({
        overlay,
        tab,
        isLoggedIn,
        authMode,
        isAdminPath,
      });
      switch (action.type) {
        case "close-admin":
          window.history.pushState({}, "", "/");
          setIsAdminPath(false);
          return;
        case "close-overlay":
          setOverlay(null);
          return;
        case "switch-auth":
          setAuthMode("login");
          return;
        case "go-home":
          setTab("home");
          return;
        case "leave-app":
          if (canGoBack) {
            window.history.back();
            return;
          }
          void App.minimizeApp();
      }
    }).then((listener) => {
      if (cancelled) {
        void listener.remove();
        return;
      }
      handle = listener;
    });

    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, [
    overlay,
    tab,
    isLoggedIn,
    authMode,
    isAdminPath,
    setOverlay,
    setTab,
    setAuthMode,
    setIsAdminPath,
  ]);
}
