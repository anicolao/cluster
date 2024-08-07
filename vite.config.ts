import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import execute from "rollup-plugin-shell";

export default defineConfig({
  plugins: [
    sveltekit(),
    execute({ commands: ["./bin/version"], hook: "buildStart" }),
    execute({ commands: ["./bin/version"], hook: "handleHotUpdate" }),
  ],
  test: {
    include: ["tests/**/*.{test,spec}.{js,ts}"],
  },
  server: {
    fs: {
      allow: ["functions"],
    },
  },
});
