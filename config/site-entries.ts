import { resolve } from "node:path";

export const htmlEntryFiles = {
  main: "index.html",
  docs: "docs.html",
  reference: "reference.html",
  login: "login.html",
  signup: "signup.html",
  dashboard: "dashboard.html",
  account: "account.html",
  profile: "profile.html",
  settings: "settings.html",
  converter: "converter.html",
  community: "community.html",
  api: "api/index.html",
  confirm: "confirm.html",
  privacy: "privacy.html",
  terms: "terms.html",
  license: "license.html",
  notFound: "404.html",
  home: "home.html",
  dev: "dev/index.html"
} as const;

export function resolveHtmlEntries(rootDir: string) {
  return Object.fromEntries(
    Object.entries(htmlEntryFiles).map(([key, file]) => [key, resolve(rootDir, file)])
  );
}
