import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers/AppProviders";
import "./styles.css";

type PageKey = "home" | "docs" | "reference" | "login" | "signup" | "dashboard" | "notfound";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("App root `#app` was not found.");
}

const page = (rootElement.dataset.page || "home") as PageKey;
const root = createRoot(rootElement);

root.render(
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500 dark:bg-slate-950 dark:text-slate-400">
    Loading page...
  </div>
);

void loadPage(page).then((Page) => {
  root.render(
    <AppProviders>
      <Page />
    </AppProviders>
  );
});

async function loadPage(pageKey: PageKey): Promise<ComponentType> {
  switch (pageKey) {
    case "docs":
      return (await import("./pages/DocsPage")).DocsPage;
    case "reference":
      return (await import("./pages/ReferencePage")).ReferencePage;
    case "login":
      return (await import("./pages/AuthPages")).LoginPage;
    case "signup":
      return (await import("./pages/AuthPages")).SignupPage;
    case "dashboard":
      return (await import("./pages/DashboardPage")).DashboardPage;
    case "notfound":
      return (await import("./pages/NotFoundPage")).NotFoundPage;
    case "home":
    default:
      return (await import("./pages/HomePage")).HomePage;
  }
}
