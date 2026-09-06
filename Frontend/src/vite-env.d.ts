/// <reference types="vite/client" />

declare const __ADMIN_ENABLED__: boolean;
declare const __APP_PLATFORM__: "web" | "native";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_PLATFORM?: "web" | "native";
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
