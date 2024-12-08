import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["lib/**", ...coverageConfigDefaults.exclude],
    },
    typecheck: {
      include: ["tests/**/*.test-d.ts"],
    },
  },
});
