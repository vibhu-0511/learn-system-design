import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// VITE_BASE_PATH lets us deploy under a subpath (GitHub Pages serves from
// /<repo-name>/). Docker/nginx and local dev serve from "/".
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  root: resolve(here, "web"),
  publicDir: resolve(here, "web/public"),
  base,
  plugins: [react()],
  build: {
    outDir: resolve(here, "dist"),
    // outDir sits outside `root`, so Vite will not clear it unless told to.
    emptyOutDir: true,
  },
  server: {
    // The site imports course/**/sim.mjs, which lives one level above `web/`.
    fs: { allow: [here] },
  },
});
