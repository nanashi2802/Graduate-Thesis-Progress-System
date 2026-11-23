import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // Each worker runs its own PGlite database (~0.4–1.2 GB). Cap the workers so
    // up to 3 parallel agent runs fit in RAM.
    maxWorkers: 4,
    // The PGlite flow tests run past the 5 s default when two agent runs share the CPU.
    testTimeout: 30_000,
  },
});
