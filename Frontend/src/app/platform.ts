export type AppPlatform = "web" | "native";

export const appPlatform: AppPlatform = __APP_PLATFORM__;

export const isNativePlatform = appPlatform === "native";
export const isAdminEnabled = __ADMIN_ENABLED__;
