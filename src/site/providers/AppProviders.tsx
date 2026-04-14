import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Info, ShieldAlert, TriangleAlert, X } from "lucide-react";
import type { AccountRole, SignupAgeBand } from "../lib/coppa";
import { clientEnv } from "../lib/env";
import { sanitizeEmailInput, sanitizeSingleLineInput } from "../lib/inputSafety";
import { runRateLimited } from "../lib/rateLimit";
import { isValidEmailInput, isValidPasswordInput, sanitizeUsernameInput } from "../lib/security";
import {
  COPPA_PARENT_CONSENTS_TABLE,
  PROFILES_TABLE,
  buildConfirmUrl,
  buildUserHandle,
  createEphemeralSupabaseClient,
  dispatchAuthStateEvent,
  ensureSupabaseConfigured,
  formatSupabaseError,
  isSupabaseConfigured,
  isUserAdmin,
  isValidUsername,
  normalizeUsername,
  signOutSupabaseSession,
  supabaseClient,
  type ProfileRecord,
  type User
} from "../lib/supabase";

type ThemeMode = "light" | "dark" | "system";
type ToastVariant = "success" | "error" | "info" | "warning";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

interface ToastMessage {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastRecord extends ToastMessage {
  id: number;
  variant: ToastVariant;
}

interface ToastContextValue {
  pushToast: (toast: ToastMessage) => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRecord | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string, captchaToken?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (payload: {
    username: string;
    email: string;
    password: string;
    captchaToken?: string;
    ageBand: SignupAgeBand;
    accountRole: AccountRole;
    parentConsentAccepted?: boolean;
  }) => Promise<{ needsEmailVerification: boolean }>;
  createManagedChildAccount: (payload: {
    username: string;
    email: string;
    password: string;
    captchaToken?: string;
    parentConsentAccepted: boolean;
  }) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (identifier: string, captchaToken?: string) => Promise<void>;
  sendPasswordResetForCurrentUser: (captchaToken?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);
const NotificationContext = createContext<NotificationContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);
const NOTIFICATION_STORAGE_KEY = "text2scratch.notifications";
const NOTIFICATION_LIMIT = 20;
const NOTIFICATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

const authUnavailableError = "Authentication is not available on this page.";
const unauthenticatedAuthContext: AuthContextValue = {
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isAdmin: false,
  signIn: async () => {
    throw new Error(authUnavailableError);
  },
  signInWithGoogle: async () => {
    throw new Error(authUnavailableError);
  },
  signUp: async () => {
    throw new Error(authUnavailableError);
  },
  createManagedChildAccount: async () => {
    throw new Error(authUnavailableError);
  },
  signOut: async () => {
    throw new Error(authUnavailableError);
  },
  sendPasswordReset: async () => {
    throw new Error(authUnavailableError);
  },
  sendPasswordResetForCurrentUser: async () => {
    throw new Error(authUnavailableError);
  },
  updatePassword: async () => {
    throw new Error(authUnavailableError);
  },
  updateUsername: async () => {
    throw new Error(authUnavailableError);
  },
  deleteCurrentAccount: async () => {
    throw new Error(authUnavailableError);
  },
  refreshProfile: async () => {
    throw new Error(authUnavailableError);
  }
};

function readStoredJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore cleanup failures.
    }
    return fallback;
  }
}

function readStoredValue(key: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the in-memory state.
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and keep the in-memory state.
  }
}

function normalizeNotification(value: unknown): Notification | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<Notification>;
  const title = String(raw.title || "").trim();
  const message = String(raw.message || "").trim();
  const createdAt = new Date(String(raw.createdAt || ""));
  const id = Number(raw.id);

  if (!title || !message || Number.isNaN(createdAt.getTime()) || !Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    title,
    message,
    time: String(raw.time || createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
    createdAt: createdAt.toISOString(),
    read: raw.read === true
  };
}

function pruneNotifications(notifications: Notification[]) {
  const cutoff = Date.now() - NOTIFICATION_RETENTION_MS;

  return notifications
    .map((notification) => normalizeNotification(notification))
    .filter((notification): notification is Notification => Boolean(notification))
    .filter((notification) => Number(new Date(notification.createdAt)) >= cutoff)
    .slice(0, NOTIFICATION_LIMIT);
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PublicAppProviders>
      <AuthProvider>{children}</AuthProvider>
    </PublicAppProviders>
  );
}

export function PublicAppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    pruneNotifications(readStoredJson<Notification[]>(NOTIFICATION_STORAGE_KEY, []))
  );

  useEffect(() => {
    writeStoredJson(NOTIFICATION_STORAGE_KEY, notifications);
  }, [notifications]);

  const addNotification = (title: string, message: string) => {
    const n: Notification = {
      id: Date.now(),
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => pruneNotifications([n, ...prev]));
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = readStoredValue("text2scratch.theme", "system");
    return (stored === "light" || stored === "dark" || stored === "system") ? stored : "system";
  });
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyMode = (nextMode: ThemeMode) => {
      const resolved = nextMode === "system" ? (mediaQuery.matches ? "dark" : "light") : nextMode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      setResolvedMode(resolved);
    };
    applyMode(mode);
    const onChange = () => applyMode(mode);
    mediaQuery.addEventListener("change", onChange);
    writeStoredValue("text2scratch.theme", mode);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ToastProvider({ children }: { children: ReactNode }) {
  const { addNotification } = useNotifications();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const idRef = useRef(0);

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const pushToast = (toast: ToastMessage) => {
    const nextToast: ToastRecord = {
      id: idRef.current + 1,
      title: toast.title,
      description: toast.description,
      variant: toast.variant || "info"
    };
    idRef.current += 1;
    setToasts((current) => [nextToast, ...current].slice(0, 4));
    addNotification(
      nextToast.title,
      nextToast.description || nextToast.title
    );
    setAnnouncement([nextToast.title, nextToast.description].filter(Boolean).join(". "));

    const durationMs = nextToast.variant === "error"
      ? 0
      : nextToast.variant === "warning"
        ? 8_000
        : 4_200;

    if (durationMs > 0) {
      window.setTimeout(() => {
        dismissToast(nextToast.id);
      }, durationMs);
    }
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            aria-live={toast.variant === "error" ? "assertive" : "polite"}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur transition duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.variant === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-950"
                : toast.variant === "error"
                  ? "border-rose-200 bg-rose-50/95 text-rose-950"
                  : toast.variant === "warning"
                    ? "border-amber-200 bg-amber-50/95 text-amber-950"
                    : "border-slate-200 bg-white/95 text-slate-950"
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {toast.variant === "success" ? <CheckCircle2 size={18} /> : 
               toast.variant === "error" ? <AlertCircle size={18} /> : 
               toast.variant === "warning" ? <TriangleAlert size={18} /> : <Info size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
              aria-label={`Dismiss ${toast.title}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { pushToast } = useToast();
  const pushToastRef = useRef(pushToast);
  const restrictedUserIdRef = useRef("");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworkBanned, setIsNetworkBanned] = useState(false);
  const apiRateLimitWindowMs = clientEnv.apiRateLimitWindowMs;
  const apiRateLimitMaxRequests = clientEnv.apiRateLimitMaxRequests;

  const isAdmin = isUserAdmin(user);

  useEffect(() => {
    pushToastRef.current = pushToast;
  }, [pushToast]);

  useEffect(() => {
    if (!user?.id || !profile?.is_banned) {
      if (!user) {
        restrictedUserIdRef.current = "";
      }
      return;
    }

    if (restrictedUserIdRef.current === user.id) {
      return;
    }

    restrictedUserIdRef.current = user.id;
    void (async () => {
      try {
        const result = await signOutSupabaseSession(supabaseClient);
        setSession(null);
        setUser(null);
        setProfile(null);
        pushToastRef.current({
          title: "Account restricted",
          description: profile.banned_reason || result.warning || "This account has been restricted by an administrator.",
          variant: "error"
        });
      } catch (error) {
        setSession(null);
        setUser(null);
        setProfile(null);
        pushToastRef.current({
          title: "Account restricted",
          description: profile.banned_reason || formatSupabaseError(error),
          variant: "error"
        });
      }
    })();
  }, [profile?.banned_reason, profile?.is_banned, user]);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: banCheck, error: banError } = await supabaseClient.rpc("is_network_banned");
        if (banError) {
          window.text2scratchRum?.trackRuntimeError?.({
            message: `Network ban check error: ${banError.message}`,
            componentStack: ""
          });
        } else if (isMounted && banCheck === true) {
          setIsNetworkBanned(true);
        }

        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
          throw error;
        }
        if (!isMounted) return;

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        dispatchAuthStateEvent(currentSession ? "signed_in" : "signed_out");
        
        try {
          await loadProfile(currentSession?.user || null, setProfile);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        pushToastRef.current({
          title: "Session restore failed",
          description: formatSupabaseError(error),
          variant: "warning"
        });
      }
    };
    void initialize();
    if (!isSupabaseConfigured) {
      return () => { isMounted = false; };
    }
    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) {
        return;
      }

      if (event === "INITIAL_SESSION") {
        // initialize already handled this
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user || null);
      dispatchAuthStateEvent(nextSession ? "signed_in" : "signed_out");
      await loadProfile(nextSession?.user || null, (value) => {
        if (isMounted) {
          setProfile(value);
          setIsLoading(false);
        }
      });
    });
    return () => { isMounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const value: AuthContextValue = {
    session, user, profile, isLoading, isAdmin,
    signIn: async (identifier, password, captchaToken) => {
      ensureSupabaseConfigured();
      await runRateLimited({
        key: "auth.signIn",
        max: Math.max(3, Math.min(apiRateLimitMaxRequests, 10)),
        windowMs: apiRateLimitWindowMs,
        message: "Too many sign-in attempts. Wait a minute and try again."
      }, async () => {
        const email = await resolveLoginEmail(identifier);
        const { error } = await supabaseClient.auth.signInWithPassword({
          email, password, options: { captchaToken }
        });
        if (error) throw new Error(formatSupabaseError(error));
      });
    },
    signInWithGoogle: async () => {
      ensureSupabaseConfigured();
      await runRateLimited({
        key: "auth.signInGoogle",
        max: 3,
        windowMs: 60_000,
        message: "Too many Google sign-in attempts. Wait a minute and try again."
      }, async () => {
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: buildConfirmUrl("verify") }
        });
        if (error) throw new Error(formatSupabaseError(error));
      });
    },
    signUp: async ({ username, email, password, captchaToken, ageBand, accountRole }) => {
      ensureSupabaseConfigured();
      return runRateLimited({
        key: "auth.signUp",
        max: 3,
        windowMs: apiRateLimitWindowMs,
        message: "Too many sign-up attempts. Wait a minute and try again."
      }, async () => {
        const normalized = normalizeUsername(sanitizeUsernameInput(username));
        const nextEmail = sanitizeEmailInput(email);
        if (!isValidUsername(normalized)) {
          throw new Error("Username must use 3-32 letters, numbers, or underscores.");
        }
        if (!isValidEmailInput(nextEmail)) {
          throw new Error("Enter a valid email address.");
        }
        if (!isValidPasswordInput(password)) {
          throw new Error("Password must be at least 8 characters long.");
        }
        const { data, error } = await supabaseClient.auth.signUp({
          email: nextEmail, password,
          options: {
            emailRedirectTo: buildConfirmUrl("verify"),
            captchaToken,
            data: { username: normalized, account_age_band: ageBand, account_role: accountRole }
          }
        });
        if (error) throw new Error(formatSupabaseError(error));
        return { needsEmailVerification: !data.session };
      });
    },
    createManagedChildAccount: async ({ username, email, password, captchaToken, parentConsentAccepted }) => {
      ensureSupabaseConfigured();
      return runRateLimited({
        key: "auth.childSignUp",
        max: 3,
        windowMs: apiRateLimitWindowMs,
        message: "Too many child account requests. Wait a minute and try again."
      }, async () => {
        const normalized = normalizeUsername(sanitizeUsernameInput(username));
        const nextEmail = sanitizeEmailInput(email);
        if (!isValidUsername(normalized)) {
          throw new Error("Child username must use 3-32 letters, numbers, or underscores.");
        }
        if (!isValidEmailInput(nextEmail)) {
          throw new Error("Enter a valid child email address.");
        }
        if (!isValidPasswordInput(password)) {
          throw new Error("Child password must be at least 8 characters long.");
        }
        if (!parentConsentAccepted) {
          throw new Error("Parental consent confirmation is required.");
        }

        const consentAcknowledgedAt = new Date().toISOString();
        const childClient = createEphemeralSupabaseClient();
        try {
          const { data, error } = await childClient.auth.signUp({
            email: nextEmail, password,
            options: {
              emailRedirectTo: buildConfirmUrl("verify"),
              captchaToken,
              data: {
                username: normalized,
                parent_managed: true,
                parent_controls_enabled: true,
                account_age_band: "under_13_with_parent",
                account_role: "standard",
                coppa_parent_consent_acknowledged_at: consentAcknowledgedAt
              }
            }
          });
          if (error) throw new Error(formatSupabaseError(error));

          if (user?.id) {
            const { error: consentError } = await supabaseClient
              .from(COPPA_PARENT_CONSENTS_TABLE)
              .insert({
                child_user_id: data.user?.id || null,
                child_username: normalized,
                child_email: nextEmail,
                parent_user_id: user.id,
                parent_email: user.email || "",
                consent_acknowledged_at: consentAcknowledgedAt
              });

            if (consentError) {
              throw new Error(formatSupabaseError(consentError));
            }
          }

          return { needsEmailVerification: !data.session };
        } finally {
          await childClient.auth.signOut().catch(() => undefined);
        }
      });
    },
    signOut: async () => {
      ensureSupabaseConfigured();
      const result = await signOutSupabaseSession(supabaseClient);
      setSession(null);
      setUser(null);
      setProfile(null);
      if (result.warning) {
        pushToast({
          title: "Signed out locally",
          description: result.warning,
          variant: "warning"
        });
      }
    },
    sendPasswordReset: async (identifier, captchaToken) => {
      ensureSupabaseConfigured();
      await runRateLimited({
        key: "auth.resetPassword",
        max: 3,
        windowMs: apiRateLimitWindowMs,
        message: "Too many reset requests. Wait a minute and try again."
      }, async () => {
        const email = await resolveLoginEmail(identifier);
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: buildConfirmUrl("recovery"),
          captchaToken
        });
        if (error) throw new Error(formatSupabaseError(error));
      });
    },
    sendPasswordResetForCurrentUser: async (captchaToken) => {
      ensureSupabaseConfigured();
      await runRateLimited({
        key: "auth.resetPassword.currentUser",
        max: 2,
        windowMs: 60_000,
        message: "Too many reset requests. Wait a minute and try again."
      }, async () => {
        if (!user?.email) throw new Error("No email found.");
        const { error } = await supabaseClient.auth.resetPasswordForEmail(user.email, {
          redirectTo: buildConfirmUrl("recovery"),
          captchaToken
        });
        if (error) throw new Error(formatSupabaseError(error));
      });
    },
    updatePassword: async (password) => {
      ensureSupabaseConfigured();
      if (!isValidPasswordInput(password)) {
        throw new Error("Password must be at least 8 characters long.");
      }
      await runRateLimited({
        key: "auth.updatePassword",
        max: 3,
        windowMs: 60_000,
        message: "Too many password updates. Wait a minute and try again."
      }, async () => {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw new Error(formatSupabaseError(error));
      });
    },
    updateUsername: async (username) => {
      ensureSupabaseConfigured();
      const normalized = normalizeUsername(sanitizeUsernameInput(username));
      if (!isValidUsername(normalized)) {
        throw new Error("Username must use 3-32 letters, numbers, or underscores.");
      }
      const { error } = await supabaseClient.auth.updateUser({ data: { username: normalized } });
      if (error) throw new Error(formatSupabaseError(error));
      if (user?.id) {
        await supabaseClient
          .from(PROFILES_TABLE)
          .upsert({
            id: user.id,
            username: normalized,
            email: user.email || ""
          }, { onConflict: "id" });
      }
      await loadProfile(user, setProfile);
    },
    deleteCurrentAccount: async () => {
      ensureSupabaseConfigured();
      await runRateLimited({
        key: "auth.deleteAccount",
        max: 2,
        windowMs: 5 * 60_000,
        message: "Account deletion was triggered too many times. Wait a few minutes and try again."
      }, async () => {
        const { error } = await supabaseClient.rpc("delete_current_account");
        if (error) throw new Error(formatSupabaseError(error));
        await signOutSupabaseSession(supabaseClient);
        setSession(null);
        setUser(null);
        setProfile(null);
      });
    },
    refreshProfile: async () => {
      ensureSupabaseConfigured();
      await loadProfile(user, setProfile);
    }
  };

  if (isNetworkBanned) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950 animate-in fade-in duration-500">
        <div className="max-w-sm space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-rose-500/10 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter">Access Restricted</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              This network node has been restricted by an administrator.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            If you believe this is an error, contact support or try a different network gateway.
          </div>
        </div>
      </section>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadProfile(user: User | null, setProfile: (v: ProfileRecord | null) => void) {
  ensureSupabaseConfigured();
  if (!user) { setProfile(null); return; }
  const { data, error } = await supabaseClient.from(PROFILES_TABLE).select("*").eq("id", user.id).maybeSingle();
  if (error || !data) {
    const fallbackProfile = {
      id: user.id,
      username: buildUserHandle(user),
      email: user.email || "",
      is_banned: false
    };
    setProfile(fallbackProfile);
    try {
      await supabaseClient
        .from(PROFILES_TABLE)
        .upsert(fallbackProfile, { onConflict: "id" });
    } catch {
      // Ignore profile bootstrap failures and keep the fallback profile in memory.
    }
    return;
  }
  setProfile(data);
}

async function resolveLoginEmail(identifier: string) {
  ensureSupabaseConfigured();
  const value = sanitizeSingleLineInput(identifier, 254).toLowerCase();
  if (value.includes("@")) return value;
  const { data, error } = await supabaseClient.rpc("resolve_login_email", { login_identifier: normalizeUsername(value) });
  if (error || !data) throw new Error("User not found.");
  return String(data).toLowerCase();
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme error.");
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast error.");
  return context;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications error.");
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth error.");
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext) || unauthenticatedAuthContext;
}
