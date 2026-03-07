import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import {
  buildConfirmUrl,
  formatSupabaseError,
  isValidUsername,
  normalizeUsername,
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

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRecord | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string, captchaToken?: string) => Promise<void>;
  signUp: (payload: { username: string; email: string; password: string; captchaToken?: string }) => Promise<{ needsEmailVerification: boolean }>;
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
const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredTheme());
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
    window.localStorage.setItem("text2scratch.theme", mode);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
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
    window.setTimeout(() => {
      dismissToast(nextToast.id);
    }, 4200);
  };

  useLayoutEffect(() => {
    const host = window as Window & {
      text2scratchToast?: {
        show: (input: string | ToastMessage, severity?: ToastVariant) => void;
        dismissAll: () => void;
        ensureHost: () => void;
      };
    };

    host.text2scratchToast = {
      show: (input, severity = "info") => {
        const nextToast = normalizeLegacyToast(input, severity);
        if (!nextToast.title && !nextToast.description) {
          return;
        }
        pushToast(nextToast);
      },
      dismissAll: () => setToasts([]),
      ensureHost: () => undefined
    };
  }, [pushToast]);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-3xl flex-col gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur transition duration-200 motion-safe:animate-[toast-in_220ms_ease-out] ${
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
              {toast.variant === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : toast.variant === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : toast.variant === "warning" ? (
                <TriangleAlert className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p
                  className={`mt-1 text-sm ${
                    toast.variant === "success"
                      ? "text-emerald-800"
                      : toast.variant === "error"
                        ? "text-rose-800"
                        : toast.variant === "warning"
                          ? "text-amber-800"
                          : "text-slate-600"
                  }`}
                >
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user || null);
      try {
        await loadProfile(data.session?.user || null, setProfile);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialize().catch(() => {
      if (isMounted) {
        setProfile(null);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
      try {
        await loadProfile(nextSession?.user || null, setProfile);
      } catch {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    isLoading,
    signIn: async (identifier, password, captchaToken) => {
      const email = await resolveLoginEmail(identifier);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined
      });

      if (error) {
        throw new Error(formatSupabaseError(error));
      }
    },
    signUp: async ({ username, email, password, captchaToken }) => {
      const normalized = normalizeUsername(username);
      if (!isValidUsername(normalized)) {
        throw new Error("Username must be 3 to 32 characters using lowercase letters, numbers, or underscores.");
      }

      const available = await isUsernameAvailable(normalized);
      if (!available) {
        throw new Error("Username is already taken.");
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildConfirmUrl("verify"),
          data: {
            username: normalized
          },
          captchaToken
        }
      });

      if (error) {
        throw new Error(formatSupabaseError(error));
      }

      return {
        needsEmailVerification: !data.session
      };
    },
    signOut: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw new Error(formatSupabaseError(error));
      }
      setProfile(null);
    },
    sendPasswordReset: async (identifier, captchaToken) => {
      const email = await resolveLoginEmail(identifier);
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: buildConfirmUrl("recovery"),
        captchaToken
      });

      if (error) {
        throw new Error(formatSupabaseError(error));
      }
    },
    sendPasswordResetForCurrentUser: async (captchaToken) => {
      const email = user?.email;
      if (!email) {
        throw new Error("Current account has no email.");
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: buildConfirmUrl("recovery"),
        captchaToken
      });

      if (error) {
        throw new Error(formatSupabaseError(error));
      }
    },
    updatePassword: async (password) => {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        throw new Error(formatSupabaseError(error));
      }
    },
    updateUsername: async (username) => {
      const normalized = normalizeUsername(username);
      if (!isValidUsername(normalized)) {
        throw new Error("Username must be 3 to 32 characters using lowercase letters, numbers, or underscores.");
      }

      if (profile?.username !== normalized) {
        const available = await isUsernameAvailable(normalized);
        if (!available) {
          throw new Error("Username is already taken.");
        }
      }

      const { error: authError } = await supabaseClient.auth.updateUser({
        data: {
          username: normalized
        }
      });

      if (authError) {
        throw new Error(formatSupabaseError(authError));
      }

      const nextProfile = {
        id: user?.id || "",
        username: normalized,
        email: user?.email || ""
      };

      const { error } = await supabaseClient
        .from("profiles")
        .upsert(nextProfile, {
          onConflict: "id"
        });

      if (error && !/relation .* does not exist/i.test(String(error.message || ""))) {
        throw new Error(formatSupabaseError(error));
      }

      await loadProfile(user, setProfile);
    },
    deleteCurrentAccount: async () => {
      const { error } = await supabaseClient.rpc("delete_current_account");
      if (error) {
        throw new Error(formatSupabaseError(error));
      }

      await supabaseClient.auth.signOut();
      setProfile(null);
    },
    refreshProfile: async () => {
      await loadProfile(user, setProfile);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadProfile(user: User | null, setProfile: (value: ProfileRecord | null) => void) {
  if (!user) {
    setProfile(null);
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, email, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (/relation .* does not exist/i.test(String(error.message || ""))) {
      setProfile({
        id: user.id,
        username: String(user.user_metadata.username || user.email || "user"),
        email: user.email || ""
      });
      return;
    }

    throw new Error(formatSupabaseError(error));
  }

  setProfile(data || {
    id: user.id,
    username: String(user.user_metadata.username || user.email || "user"),
    email: user.email || ""
  });
}

async function resolveLoginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (!value) {
    throw new Error("Missing username or email.");
  }

  if (value.includes("@")) {
    return value;
  }

  const { data, error } = await supabaseClient.rpc("resolve_login_email", {
    login_identifier: normalizeUsername(value)
  });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  if (!data) {
    throw new Error("Username not found.");
  }

  return String(data).toLowerCase();
}

async function isUsernameAvailable(username: string) {
  const { data, error } = await supabaseClient.rpc("is_username_available", {
    candidate_username: normalizeUsername(username)
  });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return Boolean(data);
}

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem("text2scratch.theme");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function normalizeLegacyToast(input: string | ToastMessage, severity: ToastVariant): ToastMessage {
  if (typeof input === "string") {
    return {
      title: legacyTitleForVariant(severity),
      description: input,
      variant: severity
    };
  }

  return {
    title: input.title,
    description: input.description,
    variant: input.variant || severity
  };
}

function legacyTitleForVariant(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "Saved";
    case "warning":
      return "Check this";
    case "error":
      return "Action failed";
    default:
      return "Update";
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside AppProviders.");
  }
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside AppProviders.");
  }
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AppProviders.");
  }
  return context;
}
