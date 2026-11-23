
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,

    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"]
        }
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/setup.ts"],
          fileParallelism: false
        }
      }
    ]
  }
});
