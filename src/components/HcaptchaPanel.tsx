import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { ShieldCheck } from "lucide-react";
import { loadExternalScript } from "../lib/loadExternalScript";
import {
  clearCachedCaptchaToken,
  getHcaptchaScriptUrl,
  getInitialCaptchaStatus,
  readCachedCaptchaToken,
  saveCachedCaptchaToken,
  type HcaptchaController,
  type HcaptchaStatus
} from "../lib/hcaptcha";
import { getHcaptchaSiteKey } from "../lib/supabase";

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: Element, options: Record<string, unknown>) => string | number;
      reset: (widgetId?: string | number) => void;
      remove?: (widgetId?: string | number) => void;
      getResponse: (widgetId?: string | number) => string;
    };
  }
}

interface HcaptchaPanelProps {
  actionLabel: string;
  controllerRef: MutableRefObject<HcaptchaController | null>;
  className?: string;
}

export function HcaptchaPanel({ actionLabel, controllerRef, className = "" }: HcaptchaPanelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const [status, setStatus] = useState<HcaptchaStatus>(() => getInitialCaptchaStatus());
  const siteKey = getHcaptchaSiteKey();
  const isRequired = siteKey.length > 0;

  useEffect(() => {
    controllerRef.current = {
      isRequired,
      getToken: () => {
        if (!isRequired) {
          return "";
        }

        if (typeof window.hcaptcha === "object" && widgetIdRef.current !== null) {
          const liveToken = String(window.hcaptcha.getResponse(widgetIdRef.current) || "").trim();
          if (liveToken) {
            saveCachedCaptchaToken(liveToken);
            setStatus("verified");
            return liveToken;
          }
        }

        return readCachedCaptchaToken();
      },
      reset: ({ clearCache = false } = {}) => {
        if (clearCache) {
          clearCachedCaptchaToken();
        }
        if (typeof window.hcaptcha === "object" && widgetIdRef.current !== null) {
          window.hcaptcha.reset(widgetIdRef.current);
        }
        setStatus(clearCache ? "idle" : getInitialCaptchaStatus());
      }
    };

    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef, isRequired]);

  useEffect(() => {
    if (!isRequired || !mountRef.current) {
      return;
    }

    let disposed = false;
    const mountNode = mountRef.current;

    const mountWidget = async () => {
      try {
        await loadExternalScript(getHcaptchaScriptUrl());

        const waitUntil = Date.now() + 8000;
        while (!(typeof window.hcaptcha === "object" && typeof window.hcaptcha.render === "function")) {
          if (disposed) {
            return;
          }
          if (Date.now() > waitUntil) {
            throw new Error("hCaptcha timeout");
          }
          await new Promise((resolve) => window.setTimeout(resolve, 100));
        }

        if (disposed || mountNode.childElementCount > 0) {
          return;
        }

        widgetIdRef.current = window.hcaptcha.render(mountNode, {
          sitekey: siteKey,
          callback: (token: unknown) => {
            saveCachedCaptchaToken(String(token || ""));
            setStatus("verified");
          },
          "expired-callback": () => {
            clearCachedCaptchaToken();
            setStatus("expired");
          },
          "error-callback": () => {
            clearCachedCaptchaToken();
            setStatus("error");
          }
        });
      } catch (_error) {
        setStatus("error");
      }
    };

    void mountWidget();

    return () => {
      disposed = true;
      if (typeof window.hcaptcha === "object" && widgetIdRef.current !== null && typeof window.hcaptcha.remove === "function") {
        window.hcaptcha.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [isRequired, siteKey]);

  return (
    <div className={`rounded-[1.75rem] border border-black/10 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Captcha check</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{getHint(status, actionLabel)}</p>
        </div>
      </div>
      {isRequired ? (
        <div ref={mountRef} className="mt-4 min-h-[78px]" />
      ) : (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          hCaptcha is not configured for this deployment, so submissions are running without the extra challenge.
        </p>
      )}
    </div>
  );
}

function getHint(status: HcaptchaStatus, actionLabel: string) {
  switch (status) {
    case "cached":
      return "Captcha was verified recently. The saved token will be reused until it expires.";
    case "verified":
      return "Captcha verified. You can continue without solving it again for a short time.";
    case "expired":
      return "Captcha expired. Complete it again before continuing.";
    case "error":
      return "hCaptcha failed to load. Check the configured site key and allowed domain.";
    case "disabled":
      return "Captcha is currently disabled for this environment.";
    default:
      return `Complete captcha before ${actionLabel}.`;
  }
}
