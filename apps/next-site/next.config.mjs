import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = process.env.GITHUB_ACTIONS === "true" && repositoryName
  ? `/${repositoryName}`
  : "";
const outputFileTracingRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath,
  assetPrefix: basePath || undefined,
  outputFileTracingRoot
};

export default nextConfig;
