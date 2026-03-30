import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { AccountRole, SignupAgeBand } from "../lib/coppa";
import {
  buildConfirmUrl,
  createEphemeralSupabaseClient,
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

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
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

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    readStoredJson<Notification[]>("text2scratch.notifications", [])
  );

  useEffect(() => {
    writeStoredJson("text2scratch.notifications", notifications);
  }, [notifications]);

  const addNotification = (title: string, message: string) => {
    const n: Notification = {
      id: Date.now(),
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [n, ...prev].slice(0, 20));
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
  const idRef = useRef(0);

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
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== nextToast.id));
    }, 4200);
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
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

  const isAdmin = String(user?.email || "").trim().toLowerCase() === "zhibu378orangetiger707@gmail.com";

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user || null);
      try { await loadProfile(data.session?.user || null, setProfile); } 
      finally { if (isMounted) setIsLoading(false); }
    };
    void initialize();
    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user || null);
      await loadProfile(nextSession?.user || null, (value) => {
        if (isMounted) {
          setProfile(value);
        }
      });
    });
    return () => { isMounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const value: AuthContextValue = {
    session, user, profile, isLoading, isAdmin,
    signIn: async (identifier, password, captchaToken) => {
      const email = await resolveLoginEmail(identifier);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email, password, options: { captchaToken }
      });
      if (error) throw new Error(formatSupabaseError(error));
    },
    signInWithGoogle: async () => {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: buildConfirmUrl("verify") }
      });
      if (error) throw new Error(formatSupabaseError(error));
    },
    signUp: async ({ username, email, password, captchaToken, ageBand, accountRole }) => {
      const normalized = normalizeUsername(username);
      const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: buildConfirmUrl("verify"),
          captchaToken,
          data: { username: normalized, account_age_band: ageBand, account_role: accountRole }
        }
      });
      if (error) throw new Error(formatSupabaseError(error));
      return { needsEmailVerification: !data.session };
    },
    createManagedChildAccount: async ({ username, email, password, captchaToken }) => {
      const childClient = createEphemeralSupabaseClient();
      const { data, error } = await childClient.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: buildConfirmUrl("verify"),
          captchaToken,
          data: { username: normalizeUsername(username), parent_managed: true }
        }
      });
      if (error) throw new Error(formatSupabaseError(error));
      await childClient.auth.signOut().catch(() => undefined);
      return { needsEmailVerification: !data.session };
    },
    signOut: async () => {
      await supabaseClient.auth.signOut();
      setProfile(null);
    },
    sendPasswordReset: async (identifier, captchaToken) => {
      const email = await resolveLoginEmail(identifier);
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: buildConfirmUrl("recovery"),
        captchaToken
      });
      if (error) throw new Error(formatSupabaseError(error));
    },
    sendPasswordResetForCurrentUser: async (captchaToken) => {
      if (!user?.email) throw new Error("No email found.");
      const { error } = await supabaseClient.auth.resetPasswordForEmail(user.email, {
        redirectTo: buildConfirmUrl("recovery"),
        captchaToken
      });
      if (error) throw new Error(formatSupabaseError(error));
    },
    updatePassword: async (password) => {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw new Error(formatSupabaseError(error));
    },
    updateUsername: async (username) => {
      const normalized = normalizeUsername(username);
      const { error } = await supabaseClient.auth.updateUser({ data: { username: normalized } });
      if (error) throw new Error(formatSupabaseError(error));
      await loadProfile(user, setProfile);
    },
    deleteCurrentAccount: async () => {
      const { error } = await supabaseClient.rpc("delete_current_account");
      if (error) throw new Error(formatSupabaseError(error));
      await supabaseClient.auth.signOut();
      setProfile(null);
    },
    refreshProfile: async () => { await loadProfile(user, setProfile); }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadProfile(user: User | null, setProfile: (v: ProfileRecord | null) => void) {
  if (!user) { setProfile(null); return; }
  const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) {
    setProfile({ id: user.id, username: String(user.user_metadata.username || user.email?.split("@")[0] || "user"), email: user.email || "" });
    return;
  }
  setProfile(data);
}

async function resolveLoginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
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
