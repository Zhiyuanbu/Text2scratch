import { Component, type ErrorInfo, type ReactNode } from "react";
import { createErrorReport } from "../lib/errorReports";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected application error."
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    window.text2scratchRum?.trackRuntimeError?.({
      message: error instanceof Error ? error.message : "Unknown runtime error",
      componentStack: errorInfo.componentStack?.slice(0, 500) || ""
    });
    if (import.meta.env.DEV) {
      console.error("Application error boundary caught an error.", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const report = createErrorReport(this.state.message, {
        area: window.location.pathname,
        fallback: "Unexpected application error."
      });

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
          <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Application error</h1>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              A runtime error interrupted the page. Reload to retry, then use the report below if it happens again.
            </p>
            <p className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {report.detail}
            </p>
            <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {report.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-[#4d97ff] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
