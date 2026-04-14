import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { AppPageKey } from "./config/pages";
import { registerServiceWorker } from "./lib/serviceWorker";
import { AppProviders } from "./providers/AppProviders";
import "./styles.css";

type PageComponent = LazyExoticComponent<ComponentType>;

const pageComponents: Record<AppPageKey, PageComponent> = {
  home: lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage }))),
  docs: lazy(() => import("./pages/DocsPage").then((module) => ({ default: module.DocsPage }))),
  reference: lazy(() => import("./pages/ReferencePage").then((module) => ({ default: module.ReferencePage }))),
  converter: lazy(() => import("./pages/ConverterPage").then((module) => ({ default: module.ConverterPage }))),
  community: lazy(() => import("./pages/CommunityPage").then((module) => ({ default: module.CommunityPage }))),
  login: lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.LoginPage }))),
  signup: lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.SignupPage }))),
  dashboard: lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))),
  privacy: lazy(() => import("./pages/LegalPages").then((module) => ({ default: module.PrivacyPage }))),
  terms: lazy(() => import("./pages/LegalPages").then((module) => ({ default: module.TermsPage }))),
  license: lazy(() => import("./pages/LegalPages").then((module) => ({ default: module.LicensePage }))),
  confirm: lazy(() => import("./pages/ConfirmPage").then((module) => ({ default: module.ConfirmPage }))),
  notfound: lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })))
};

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("App root `#app` was not found.");
}

const requestedPage = String(rootElement.dataset.page || "home") as AppPageKey;
const Page = pageComponents[requestedPage] || pageComponents.home;
const root = createRoot(rootElement);

registerServiceWorker();

root.render(
  <ErrorBoundary pageName={requestedPage}>
    <AppProviders>
      <Suspense fallback={<PageBootSplash />}>
        <Page />
      </Suspense>
    </AppProviders>
  </ErrorBoundary>
);

function PageBootSplash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-sm font-medium text-slate-500 dark:bg-slate-950 dark:text-slate-400"
    >
      Loading page...
    </div>
  );
}
