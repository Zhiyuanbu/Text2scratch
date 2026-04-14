import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { ShieldCheck } from "lucide-react";
import { loadExternalScript } from "../lib/loadExternalScript";
import {
  clearCachedTurnstileToken,
  getTurnstileScriptUrl,
  getInitialTurnstileStatus,
  readCachedTurnstileToken,
  saveCachedTurnstileToken,
  type TurnstileController,
  type TurnstileStatus
} from "../lib/turnstile";
import { getTurnstileSiteKey } from "../lib/supabase";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface TurnstilePanelProps {
  actionLabel: string;
  controllerRef: MutableRefObject<TurnstileController | null>;
  className?: string;
}

export function TurnstilePanel({ actionLabel, controllerRef, className = "" }: TurnstilePanelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<TurnstileStatus>(() => getInitialTurnstileStatus());
  const siteKey = getTurnstileSiteKey();
  const isRequired = siteKey.length > 0;

  useEffect(() => {
    controllerRef.current = {
      isRequired,
      getToken: () => {
        if (!isRequired) return "";
        if (typeof window.turnstile === "object" && widgetIdRef.current !== null) {
          const liveToken = window.turnstile.getResponse(widgetIdRef.current);
          if (liveToken) {
            saveCachedTurnstileToken(liveToken);
            setStatus("verified");
            return liveToken;
          }
        }
        return readCachedTurnstileToken();
      },
      reset: ({ clearCache = false } = {}) => {
        if (clearCache) clearCachedTurnstileToken();
        if (typeof window.turnstile === "object" && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setStatus(clearCache ? "idle" : getInitialTurnstileStatus());
      }
    };
    return () => { controllerRef.current = null; };
  }, [controllerRef, isRequired]);

  useEffect(() => {
    if (!isRequired || !mountRef.current) return;
    let disposed = false;
    const mountNode = mountRef.current;

    const mountWidget = async () => {
      try {
        await loadExternalScript(getTurnstileScriptUrl());
        const waitUntil = Date.now() + 8000;
        while (!(typeof window.turnstile === "object" && typeof window.turnstile.render === "function")) {
          if (disposed) return;
          if (Date.now() > waitUntil) throw new Error("Turnstile timeout");
          await new Promise((resolve) => window.setTimeout(resolve, 100));
        }
        if (disposed || mountNode.childElementCount > 0) return;

        widgetIdRef.current = window.turnstile.render(mountNode, {
          sitekey: siteKey,
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
          callback: (token: string) => {
            saveCachedTurnstileToken(token);
            setStatus("verified");
          },
          "expired-callback": () => {
            clearCachedTurnstileToken();
            setStatus("expired");
          },
          "error-callback": () => {
            clearCachedTurnstileToken();
            setStatus("error");
          }
        });
      } catch {
        setStatus("error");
      }
    };

    void mountWidget();
    return () => {
      disposed = true;
      if (typeof window.turnstile === "object" && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      if (mountNode) mountNode.innerHTML = "";
    };
  }, [isRequired, siteKey]);

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
        <div className="min-w-0">
          <p className="text-[0.75rem] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Security Verification</p>
          <p className="mt-1 text-[0.7rem] leading-normal text-slate-500">{getHint(status, actionLabel)}</p>
        </div>
      </div>
      {isRequired ? (
        <div ref={mountRef} aria-label="Turnstile verification widget" className="mt-3 min-h-[65px] flex justify-center" />
      ) : (
        <p className="mt-3 text-[0.7rem] font-medium text-amber-600">
          Turnstile is not active for this session.
        </p>
      )}
    </div>
  );
}

function getHint(status: TurnstileStatus, actionLabel: string) {
  switch (status) {
    case "cached": return "Verified recently. Reusing token.";
    case "verified": return "Verification successful.";
    case "expired": return "Verification expired. Please retry.";
    case "error": return "Verification failed to load.";
    default: return `Complete security check to ${actionLabel}.`;
  }
}
