const scriptLoads = new Map<string, Promise<void>>();

export function loadExternalScript(src: string) {
  const absoluteSrc = new URL(src, window.location.href).toString();
  const existing = scriptLoads.get(absoluteSrc);
  if (existing) {
    return existing;
  }

  const loader = new Promise<void>((resolve, reject) => {
    const present = document.querySelector<HTMLScriptElement>(`script[src="${absoluteSrc}"]`);
    if (present?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (present && present.dataset.loaded !== "true") {
      present.remove();
    }

    const script = document.createElement("script");
    script.src = absoluteSrc;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.dataset.loading = "true";

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      script.dataset.loaded = "true";
      delete script.dataset.loading;
      delete script.dataset.failed;
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      delete script.dataset.loading;
      script.dataset.failed = "true";
      script.remove();
      scriptLoads.delete(absoluteSrc);
      reject(new Error(`Could not load external script: ${absoluteSrc}`));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    document.head.appendChild(script);
  });

  scriptLoads.set(absoluteSrc, loader);
  return loader;
}
