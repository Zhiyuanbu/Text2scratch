export interface SitePageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  htmlPath: string;
  robots?: string;
  ogType?: "website" | "article";
  includeInSitemap?: boolean;
  schema?: Array<"WebSite" | "WebApplication" | "SoftwareApplication">;
}

export const siteOrigin = "https://zhiyuanbu.github.io/Text2scratch/";
export const socialImagePath = "og-image.svg";
export const defaultRobots = "index,follow,max-image-preview:large";
export const noIndexRobots = "noindex,nofollow";

export const sitePageMetadata: Record<string, SitePageMeta> = {
  "index.html": {
    title: "text2scratch | Plain-text Scratch authoring",
    description: "Write Scratch projects as text, validate them in the browser, and export real .sb3 files.",
    canonicalPath: "/",
    htmlPath: "index.html",
    includeInSitemap: true,
    schema: ["WebSite", "WebApplication", "SoftwareApplication"]
  },
  "docs.html": {
    title: "text2scratch | Docs",
    description: "Learn text2scratch syntax with practical examples, validation guidance, and clearer onboarding.",
    canonicalPath: "/docs.html",
    htmlPath: "docs.html",
    includeInSitemap: true,
    schema: ["WebApplication"]
  },
  "reference.html": {
    title: "text2scratch | Reference",
    description: "Browse the full text2scratch command catalog, preview Scratch-style blocks, and copy exact syntax.",
    canonicalPath: "/reference.html",
    htmlPath: "reference.html",
    includeInSitemap: true,
    schema: ["WebApplication"]
  },
  "converter.html": {
    title: "text2scratch | Workspace",
    description: "Author text2scratch projects, validate structure, import SB3 files, and export Scratch projects in the browser.",
    canonicalPath: "/converter.html",
    htmlPath: "converter.html",
    includeInSitemap: true,
    schema: ["WebApplication", "SoftwareApplication"]
  },
  "community.html": {
    title: "text2scratch | Community",
    description: "Browse public text2scratch projects, inspect shared examples, and open them in the workspace.",
    canonicalPath: "/community.html",
    htmlPath: "community.html",
    includeInSitemap: true,
    schema: ["WebApplication"]
  },
  "privacy.html": {
    title: "text2scratch | Privacy",
    description: "Read how text2scratch handles account data, local storage, and published project visibility.",
    canonicalPath: "/privacy.html",
    htmlPath: "privacy.html",
    includeInSitemap: true
  },
  "terms.html": {
    title: "text2scratch | Terms",
    description: "Read the service rules, usage limits, and account responsibilities for text2scratch.",
    canonicalPath: "/terms.html",
    htmlPath: "terms.html",
    includeInSitemap: true
  },
  "license.html": {
    title: "text2scratch | License",
    description: "Review the text2scratch non-commercial attribution license and redistribution conditions.",
    canonicalPath: "/license.html",
    htmlPath: "license.html",
    includeInSitemap: true
  },
  "login.html": {
    title: "text2scratch | Login",
    description: "Sign in to your text2scratch account.",
    canonicalPath: "/login.html",
    htmlPath: "login.html",
    robots: noIndexRobots
  },
  "signup.html": {
    title: "text2scratch | Sign up",
    description: "Create a text2scratch account to save and share projects.",
    canonicalPath: "/signup.html",
    htmlPath: "signup.html",
    robots: noIndexRobots
  },
  "dashboard.html": {
    title: "text2scratch | Dashboard",
    description: "Manage your text2scratch account, profile, theme, and security settings.",
    canonicalPath: "/dashboard.html",
    htmlPath: "dashboard.html",
    robots: noIndexRobots
  },
  "confirm.html": {
    title: "text2scratch | Confirm account",
    description: "Complete account verification or password recovery for text2scratch.",
    canonicalPath: "/confirm.html",
    htmlPath: "confirm.html",
    robots: noIndexRobots
  },
  "404.html": {
    title: "text2scratch | Not found",
    description: "The requested text2scratch page could not be found.",
    canonicalPath: "/404.html",
    htmlPath: "404.html",
    robots: noIndexRobots
  },
  "api/index.html": {
    title: "text2scratch | API",
    description: "Static JSON validator endpoint for text2scratch on GitHub Pages.",
    canonicalPath: "/api/",
    htmlPath: "api/index.html",
    robots: noIndexRobots
  },
  "dev/index.html": {
    title: "text2scratch /dev reference",
    description: "Plain technical reference for text2scratch syntax, project structure, and command inventory.",
    canonicalPath: "/dev/",
    htmlPath: "dev/index.html",
    robots: noIndexRobots
  },
  "account.html": {
    title: "text2scratch | Redirecting",
    description: "Redirecting to the current text2scratch dashboard route.",
    canonicalPath: "/dashboard.html#overview",
    htmlPath: "account.html",
    robots: noIndexRobots
  },
  "profile.html": {
    title: "text2scratch | Redirecting",
    description: "Redirecting to the current text2scratch dashboard profile route.",
    canonicalPath: "/dashboard.html#profile",
    htmlPath: "profile.html",
    robots: noIndexRobots
  },
  "settings.html": {
    title: "text2scratch | Redirecting",
    description: "Redirecting to the current text2scratch dashboard appearance route.",
    canonicalPath: "/dashboard.html#appearance",
    htmlPath: "settings.html",
    robots: noIndexRobots
  },
  "home.html": {
    title: "text2scratch | Redirecting",
    description: "Redirecting to the current text2scratch home page.",
    canonicalPath: "/",
    htmlPath: "home.html",
    robots: noIndexRobots
  }
};

export function normalizeHtmlPath(pathname: string) {
  const normalized = String(pathname || "index.html").replace(/^\//, "");
  if (!normalized || normalized === ".") {
    return "index.html";
  }
  return normalized;
}

export function getSitePageMeta(pathname: string) {
  return sitePageMetadata[normalizeHtmlPath(pathname)] || sitePageMetadata["index.html"];
}

export function buildCanonicalUrl(pathname: string) {
  return new URL(getSitePageMeta(pathname).canonicalPath.replace(/^\//, ""), siteOrigin).toString();
}

export function buildStructuredData(pathname: string) {
  const meta = getSitePageMeta(pathname);
  const url = buildCanonicalUrl(pathname);
  const schema = meta.schema || [];
  const items: Array<Record<string, unknown>> = [];

  if (schema.includes("WebSite")) {
    items.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "text2scratch",
      alternateName: "Text2scratch",
      url: new URL("", siteOrigin).toString()
    });
  }

  if (schema.includes("WebApplication")) {
    items.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "text2scratch",
      applicationCategory: "DeveloperApplication",
      browserRequirements: "Requires JavaScript and a modern browser",
      operatingSystem: "Any",
      description: meta.description,
      url
    });
  }

  if (schema.includes("SoftwareApplication")) {
    items.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "text2scratch",
      applicationCategory: "DeveloperApplication",
      softwareVersion: "1.0.0",
      operatingSystem: "Any",
      downloadUrl: buildCanonicalUrl("converter.html"),
      description: meta.description,
      url
    });
  }

  return items;
}

export function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://challenges.cloudflare.com https://js.hcaptcha.com https://www.google.com",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://challenges.cloudflare.com https://newassets.hcaptcha.com https://*.hcaptcha.com https://www.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
}

export function buildSitemapXml() {
  const urls = Object.values(sitePageMetadata)
    .filter((page) => page.includeInSitemap)
    .map((page) => `  <url>\n    <loc>${buildCanonicalUrl(page.htmlPath)}</loc>\n  </url>`);

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
