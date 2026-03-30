import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolveHtmlEntries } from "./config/site-entries";

import { cloudflare } from "@cloudflare/vite-plugin";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName
  ? `/${repositoryName}/`
  : "/";
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: resolveHtmlEntries(rootDir)
    }
  }
});