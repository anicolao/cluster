import { sveltekit } from "@sveltejs/kit/vite";
import { coverageConfigDefaults, defineConfig } from "vitest/config";
import execute from "rollup-plugin-shell";

export default defineConfig({
  plugins: [
    sveltekit(),
    execute({ commands: ["./bin/version"], hook: "buildStart" }),
  ],
  test: {
    include: ["tests/**/*.{test,spec}.{js,ts}"],
    coverage: {
      exclude: [
        "build/**",
        "functions/**",
        "svelte.config.js",
        ...coverageConfigDefaults.exclude,
      ],
    },
    typecheck: {
      include: ["tests/**/*.test-d.ts"],
    },
  },
  server: {
    fs: {
      allow: ["functions"],
    },
  },
});
