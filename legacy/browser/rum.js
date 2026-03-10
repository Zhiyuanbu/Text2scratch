(() => {
  const rum = window.DD_RUM;
  if (!rum || typeof rum.init !== "function") {
    return;
  }

  if (!/^https?:$/.test(window.location.protocol)) {
    return;
  }

  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
    return;
  }

  const host = window.location.hostname.toLowerCase();

  rum.init({
    applicationId: "743e1452-acb2-4604-99c8-290f829fe85a",
    clientToken: "ab1da92674245368f7e000c8256b809956",
    site: "us5.datadoghq.com",
    service: "text2scratch",
    env: resolveEnv(host),
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackBfcacheViews: true,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    defaultPrivacyLevel: "mask-user-input"
  });

  exposeRumHelpers();

  function resolveEnv(hostname) {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }

    if (hostname.includes("staging") || hostname.includes("preview") || hostname.includes("dev")) {
      return "staging";
    }

    return "production";
  }

  function exposeRumHelpers() {
    window.text2scratchRum = {
      trackAccountCreated(context = {}) {
        addAction("account_created", context);
      },
      trackProjectShared(context = {}) {
        addAction("project_shared", context);
      }
    };
  }

  function addAction(actionName, context) {
    if (typeof rum.addAction !== "function") {
      return;
    }

    rum.addAction(actionName, sanitizeContext(context));
  }

  function sanitizeContext(context) {
    if (!context || typeof context !== "object") {
      return {};
    }

    const allowedContext = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        allowedContext[key] = value;
      }
    }
    return allowedContext;
  }
})();
