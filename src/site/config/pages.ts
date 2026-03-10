export const appPageKeys = [
  "home",
  "docs",
  "reference",
  "converter",
  "community",
  "login",
  "signup",
  "dashboard",
  "privacy",
  "terms",
  "license",
  "notfound"
] as const;

export type AppPageKey = (typeof appPageKeys)[number];

export interface AppNavLink {
  href: string;
  label: string;
  page: AppPageKey;
}

export const primaryNavLinks: AppNavLink[] = [
  { href: "docs.html", label: "Docs", page: "docs" },
  { href: "reference.html", label: "Reference", page: "reference" },
  { href: "community.html", label: "Community", page: "community" }
];

export const mobileNavLinks: AppNavLink[] = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "docs.html", label: "Docs", page: "docs" },
  { href: "reference.html", label: "Reference", page: "reference" },
  { href: "converter.html", label: "Workspace", page: "converter" },
  { href: "community.html", label: "Community", page: "community" }
];
