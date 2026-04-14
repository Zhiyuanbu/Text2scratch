import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { resolveHtmlEntries } from "./config/site-entries";
import {
  buildCanonicalUrl,
  buildContentSecurityPolicy,
  buildSitemapXml,
  buildStructuredData,
  defaultRobots,
  getSitePageMeta,
  normalizeHtmlPath,
  siteOrigin,
  socialImagePath
} from "./config/site-metadata";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = process.env.GITHUB_ACTIONS === "true" && repositoryName
  ? `/${repositoryName}/`
  : "/";
const rootDir = fileURLToPath(new URL(".", import.meta.url));
const shouldAnalyzeBundle = process.env.ANALYZE === "true";

function injectSiteMetadata(): Plugin {
  return {
    name: "text2scratch-site-metadata",
    transformIndexHtml(html, context) {
      const pathname = normalizeHtmlPath(context.path || "index.html");
      const meta = getSitePageMeta(pathname);
      const canonicalUrl = buildCanonicalUrl(pathname);
      const socialImageUrl = new URL(socialImagePath, siteOrigin).toString();
      const structuredData = JSON.stringify(buildStructuredData(pathname));
      const robots = meta.robots || defaultRobots;

      return {
        html: upsertTitle(
          upsertMeta(
            upsertMeta(
              upsertMeta(html, "name", "description", meta.description),
              "name",
              "robots",
              robots
            ),
            "http-equiv",
            "Content-Security-Policy",
            buildContentSecurityPolicy()
          ),
          meta.title
        ),
        tags: [
          createTag("meta", { name: "application-name", content: "text2scratch" }),
          createTag("meta", { name: "apple-mobile-web-app-title", content: "text2scratch" }),
          createTag("meta", { name: "theme-color", content: "#1769ff" }),
          createTag("meta", { name: "color-scheme", content: "light dark" }),
          createTag("link", { rel: "canonical", href: canonicalUrl }),
          createTag("meta", { property: "og:site_name", content: "text2scratch" }),
          createTag("meta", { property: "og:type", content: meta.ogType || "website" }),
          createTag("meta", { property: "og:url", content: canonicalUrl }),
          createTag("meta", { property: "og:title", content: meta.title }),
          createTag("meta", { property: "og:description", content: meta.description }),
          createTag("meta", { property: "og:image", content: socialImageUrl }),
          createTag("meta", { property: "og:image:alt", content: "text2scratch social preview" }),
          createTag("meta", { name: "twitter:card", content: "summary_large_image" }),
          createTag("meta", { name: "twitter:title", content: meta.title }),
          createTag("meta", { name: "twitter:description", content: meta.description }),
          createTag("meta", { name: "twitter:image", content: socialImageUrl }),
          createTag("script", { type: "application/ld+json" }, structuredData),
          createTag(
            "noscript",
            {},
            "<div style=\"padding:1rem;margin:1rem;border:1px solid #cbd5e1;border-radius:0.75rem;background:#f8fafc;color:#0f172a;font:600 14px/1.5 Inter,system-ui,sans-serif\">JavaScript powers the text2scratch workspace. Static docs and legal pages still load, but editing, preview, and cloud features require JavaScript.</div>",
            "body-prepend"
          )
        ]
      };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: buildSitemapXml()
      });
    }
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    injectSiteMetadata(),
    shouldAnalyzeBundle && visualizer({
      filename: "dist/bundle-analysis.html",
      gzipSize: true,
      brotliSize: true,
      open: false
    })
  ].filter(Boolean) as Plugin[],
  esbuild: {
    pure: ["console.log", "console.debug", "console.info"]
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    reportCompressedSize: true,
    rollupOptions: {
      input: resolveHtmlEntries(rootDir),
      output: {
        manualChunks(id) {
          if (id.includes("scratchblocks")) {
            return "scratchblocks";
          }

          if (id.includes("@supabase/supabase-js")) {
            return "supabase-client";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (id.includes("monaco-editor") || id.includes("scaffolding-min")) {
            return "workspace-runtime";
          }
        }
      }
    }
  }
});

function createTag(
  tag: string,
  attrs: Record<string, string>,
  children?: string,
  injectTo: "head" | "body-prepend" = "head"
) {
  return {
    tag,
    attrs,
    children,
    injectTo
  };
}

function upsertTitle(html: string, title: string) {
  const escapedTitle = escapeHtml(title);
  if (/<title>.*<\/title>/i.test(html)) {
    return html.replace(/<title>.*<\/title>/i, `<title>${escapedTitle}</title>`);
  }
  return html.replace("</head>", `  <title>${escapedTitle}</title>\n</head>`);
}

function upsertMeta(
  html: string,
  attributeName: "name" | "property" | "http-equiv",
  attributeValue: string,
  content: string
) {
  const escapedContent = escapeHtml(content);
  const pattern = new RegExp(`<meta[^>]+${attributeName}=["']${attributeValue}["'][^>]*>`, "i");
  const replacement = `<meta ${attributeName}="${attributeValue}" content="${escapedContent}">`;

  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `  ${replacement}\n</head>`);
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
