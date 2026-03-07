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

    const script = present || document.createElement("script");
    script.src = absoluteSrc;
    script.async = true;

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      script.dataset.loaded = "true";
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      scriptLoads.delete(absoluteSrc);
      reject(new Error(`Could not load external script: ${absoluteSrc}`));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    if (!present) {
      document.head.appendChild(script);
    }
  });

  scriptLoads.set(absoluteSrc, loader);
  return loader;
}
