import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
  },
  coverage: {
    include: ["src/index.ts"],
    exclude: ["src/**/*.tsx", "src/settingsIntegration.ts", "examples/**"],
  },
});
