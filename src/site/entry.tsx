import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers/AppProviders";
import type { AppPageKey } from "./config/pages";
import "./styles.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("App root `#app` was not found.");
}

const page = (rootElement.dataset.page || "home") as AppPageKey;
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

async function loadPage(pageKey: AppPageKey): Promise<ComponentType> {
  switch (pageKey) {
    case "docs":
      return (await import("./pages/DocsPage")).DocsPage;
    case "reference":
      return (await import("./pages/ReferencePage")).ReferencePage;
    case "converter":
      return (await import("./pages/ConverterPage")).ConverterPage;
    case "community":
      return (await import("./pages/CommunityPage")).CommunityPage;
    case "login":
      return (await import("./pages/AuthPages")).LoginPage;
    case "signup":
      return (await import("./pages/AuthPages")).SignupPage;
    case "dashboard":
      return (await import("./pages/DashboardPage")).DashboardPage;
    case "privacy":
      return (await import("./pages/LegalPages")).PrivacyPage;
    case "terms":
      return (await import("./pages/LegalPages")).TermsPage;
    case "license":
      return (await import("./pages/LegalPages")).LicensePage;
    case "confirm":
      return (await import("./pages/ConfirmPage")).ConfirmPage;
    case "notfound":
      return (await import("./pages/NotFoundPage")).NotFoundPage;
    case "home":
    default:
      return (await import("./pages/HomePage")).HomePage;
  }
}
