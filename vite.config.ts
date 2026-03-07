import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName
  ? `/${repositoryName}/`
  : "/";
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        docs: resolve(rootDir, "docs.html"),
        reference: resolve(rootDir, "reference.html"),
        login: resolve(rootDir, "login.html"),
        signup: resolve(rootDir, "signup.html"),
        dashboard: resolve(rootDir, "dashboard.html"),
        account: resolve(rootDir, "account.html"),
        profile: resolve(rootDir, "profile.html"),
        settings: resolve(rootDir, "settings.html"),
        converter: resolve(rootDir, "converter.html"),
        community: resolve(rootDir, "community.html"),
        confirm: resolve(rootDir, "confirm.html"),
        privacy: resolve(rootDir, "privacy.html"),
        terms: resolve(rootDir, "terms.html"),
        license: resolve(rootDir, "license.html"),
        notFound: resolve(rootDir, "404.html"),
        home: resolve(rootDir, "home.html"),
        dev: resolve(rootDir, "dev/index.html")
      }
    }
  }
});
