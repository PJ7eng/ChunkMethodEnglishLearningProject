import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_PLATFORM__: JSON.stringify("web"),
    __ADMIN_ENABLED__: JSON.stringify(true),
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
