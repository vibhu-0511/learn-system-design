import { defineConfig } from "vitest/config";

// Kept separate from vite.config.js: that one sets root to `web/`, but tests
// live at the repo root (tests/) as well as next to the web sources.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js", "web/src/**/__tests__/**/*.test.js"],
    environment: "node",
  },
});
