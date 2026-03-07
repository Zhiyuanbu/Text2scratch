import type { FormEvent, ReactNode } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HcaptchaPanel } from "../components/HcaptchaPanel";
import { AppShell } from "../components/AppShell";
import { isCaptchaError, type HcaptchaController } from "../lib/hcaptcha";
import { buildLoginUrl } from "../lib/supabase";
import { useAuth, useToast } from "../providers/AppProviders";

type LoginMode = "signin" | "reset" | "recovery";

export function LoginPage() {
  const { user, signIn, signOut, sendPasswordReset, updatePassword } = useAuth();
  const { pushToast } = useToast();
  const captchaRef = useRef<HcaptchaController | null>(null);
  const [mode, setMode] = useState<LoginMode>(() => readLoginModeFromUrl());
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (shouldUseConfirmationPage()) {
      window.location.replace(buildConfirmationPageUrl());
      return;
    }

    const initialMode = readLoginModeFromUrl();
    setMode(initialMode);

    const params = new URLSearchParams(window.location.search);
    if (params.get("updated") === "1") {
      pushToast({
        title: "Password updated",
        description: "Sign in with the new password.",
        variant: "success"
      });
      clearQueryFeedback();
      return;
    }

    if (params.get("verified") === "1") {
      pushToast({
        title: initialMode === "recovery" ? "Recovery link verified" : "Email verified",
        description: initialMode === "recovery"
          ? "Set a new password to finish recovery."
          : "Your email is confirmed. You can sign in now.",
        variant: "success"
      });
      clearQueryFeedback();
    }
  }, []);

  useEffect(() => {
    if (user && mode !== "recovery") {
      window.location.replace("dashboard.html");
    }
  }, [mode, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      if (mode === "signin") {
        const captchaToken = requireCaptchaToken(captchaRef.current, "signing in");
        await signIn(identifier, password, captchaToken);
        pushToast({
          title: "Signed in",
          description: "Your session is ready. Opening the dashboard now.",
          variant: "success"
        });
        window.setTimeout(() => {
          window.location.assign("dashboard.html");
        }, 300);
        return;
      }

      if (mode === "reset") {
        const captchaToken = requireCaptchaToken(captchaRef.current, "requesting password reset");
        await sendPasswordReset(identifier, captchaToken);
        pushToast({
          title: "Password reset sent",
          description: "Check your inbox for the recovery link.",
          variant: "success"
        });
        return;
      }

      if (recoveryPassword.length < 6) {
        throw new Error("New password must be at least 6 characters.");
      }
      if (recoveryPassword !== recoveryConfirm) {
        throw new Error("New password confirmation must match.");
      }

      await updatePassword(recoveryPassword);
      await signOut();
      setRecoveryPassword("");
      setRecoveryConfirm("");
      clearRecoveryState();
      setMode("signin");
      pushToast({
        title: "Password updated",
        description: "Your password has been changed. Sign in with the new password.",
        variant: "success"
      });
    } catch (error) {
      if (isCaptchaError(error)) {
        captchaRef.current?.reset({ clearCache: true });
      }
      pushToast({
        title: mode === "signin" ? "Login failed" : mode === "reset" ? "Reset failed" : "Password update failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell page="login">
      <AuthFrame
        page="login"
        badge={mode === "recovery" ? "Recovery session" : "Secure account access"}
        title={mode === "recovery"
          ? "Set a new password to finish the recovery flow."
          : "Sign in or reset your password."}
        description={mode === "recovery"
          ? "The recovery link has already handled identity verification. Choose a new password and return to the normal sign-in flow."
          : "Use your email or username to sign in. After login, the dashboard gives you profile, appearance, and security controls in one place."}
        accent={mode === "recovery" ? "Recovery" : "Sign in"}
        sideTitle="After you sign in"
        sideItems={[
          "Cloud save and cross-device project access.",
          "Profile, appearance, and security controls in one dashboard.",
          "Captcha-protected auth actions."
        ]}
      >
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <AuthSwitch current="login" />

          {mode !== "recovery" ? (
            <div className="mt-6 inline-flex rounded-full border border-black/10 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/10">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "reset" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}
              >
                Reset password
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              Recovery links already verify identity. Set a new password below, then return to normal sign-in.
            </div>
          )}

          <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
            {mode === "signin" || mode === "reset" ? (
              <TextField
                label={mode === "signin" ? "Email or username" : "Account email or username"}
                value={identifier}
                onChange={setIdentifier}
                placeholder="you@example.com or username"
                autoComplete="username"
              />
            ) : null}

            {mode === "signin" ? (
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            ) : null}

            {mode === "recovery" ? (
              <>
                <PasswordField
                  label="New password"
                  value={recoveryPassword}
                  onChange={setRecoveryPassword}
                  autoComplete="new-password"
                  placeholder="Choose a new password"
                />
                <PasswordField
                  label="Confirm new password"
                  value={recoveryConfirm}
                  onChange={setRecoveryConfirm}
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                />
              </>
            ) : null}

            {mode !== "recovery" ? (
              <HcaptchaPanel
                controllerRef={captchaRef}
                actionLabel={mode === "signin" ? "signing in" : "requesting password reset"}
              />
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isPending
                ? "Working..."
                : mode === "signin"
                  ? "Log in"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Update password"}
            </button>
          </form>
        </div>
      </AuthFrame>
    </AppShell>
  );
}

export function SignupPage() {
  const { user, signUp } = useAuth();
  const { pushToast } = useToast();
  const captchaRef = useRef<HcaptchaController | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user) {
      window.location.replace("dashboard.html");
    }
  }, [user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      const captchaToken = requireCaptchaToken(captchaRef.current, "creating an account");
      const result = await signUp({ username, email, password, captchaToken });
      pushToast({
        title: "Account created",
        description: result.needsEmailVerification
          ? "Check your inbox to confirm your email before logging in."
          : "Your dashboard is ready.",
        variant: "success"
      });

      window.setTimeout(() => {
        window.location.assign(result.needsEmailVerification ? buildLoginUrl() : "dashboard.html");
      }, 400);
    } catch (error) {
      if (isCaptchaError(error)) {
        captchaRef.current?.reset({ clearCache: true });
      }
      pushToast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell page="signup">
      <AuthFrame
        page="signup"
        badge="Create account"
        title="Sign up for cloud save, sharing, and account settings."
        description="Create a username for shared projects and manage everything from the dashboard once you are signed in."
        accent="Sign up"
        sideTitle="What you get"
        sideItems={[
          "One dashboard for profile, theme, and security settings.",
          "Consistent top navigation across the site.",
          "Captcha-protected signup requests."
        ]}
      >
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <AuthSwitch current="signup" />

          <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
            <TextField
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="project_builder"
              autoComplete="username"
            />
            <TextField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Create a password"
            />

            <HcaptchaPanel controllerRef={captchaRef} actionLabel="creating an account" />

            <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
              Usernames are normalized to lowercase letters, numbers, and underscores. Email confirmation may be required depending on your Supabase auth settings.
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isPending ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </AuthFrame>
    </AppShell>
  );
}

function AuthFrame({
  badge,
  title,
  description,
  accent,
  sideTitle,
  sideItems,
  children
}: {
  page: "login" | "signup";
  badge: string;
  title: string;
  description: string;
  accent: string;
  sideTitle: string;
  sideItems: string[];
  children: ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.85fr)] lg:py-20">
      <div className="flex flex-col justify-between gap-8">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {badge}
          </span>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{accent}</p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <BenefitCard icon={<KeyRound className="h-5 w-5" />} title={sideTitle} items={sideItems} />
          <BenefitStat icon={<Sparkles className="h-5 w-5" />} title="Protected requests" description="hCaptcha is back for sign-in, signup, and reset requests in the new flow." />
          <BenefitStat icon={<UserRound className="h-5 w-5" />} title="Unified dashboard" description="Account, profile, appearance, and security are handled in one destination after auth." />
        </div>
      </div>

      <div className="flex items-center">{children}</div>
    </section>
  );
}

function AuthSwitch({ current }: { current: "login" | "signup" }) {
  return (
    <nav className="inline-flex rounded-[1.1rem] border border-black/10 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/10" aria-label="Auth pages">
      <a
        href="login.html"
        className={`rounded-[0.9rem] px-5 py-3 text-base font-semibold transition ${current === "login" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}
      >
        Log-in
      </a>
      <a
        href="signup.html"
        className={`rounded-[0.9rem] px-5 py-3 text-base font-semibold transition ${current === "signup" ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"}`}
      >
        Sign-up
      </a>
    </nav>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
        required
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <span className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function BenefitCard({
  icon,
  title,
  items
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function BenefitStat({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </article>
  );
}

function requireCaptchaToken(controller: HcaptchaController | null, actionLabel: string) {
  if (!controller?.isRequired) {
    return undefined;
  }

  const token = controller.getToken();
  if (!token) {
    throw new Error(`Complete the captcha before ${actionLabel}.`);
  }

  return token;
}

function readLoginModeFromUrl(): LoginMode {
  const search = new URLSearchParams(window.location.search);
  const hash = String(window.location.hash || "");
  if (search.get("mode") === "recovery" || search.get("type") === "recovery" || hash.includes("type=recovery")) {
    return "recovery";
  }
  if (search.get("mode") === "reset") {
    return "reset";
  }
  return "signin";
}

function shouldUseConfirmationPage() {
  const search = new URLSearchParams(window.location.search);
  if (String(search.get("mode") || "").trim().toLowerCase() !== "verify") {
    return false;
  }

  return Boolean(String(search.get("token_hash") || "").trim() || String(search.get("code") || "").trim());
}

function buildConfirmationPageUrl() {
  const current = new URL(window.location.href);
  const url = new URL("confirm.html", window.location.href);
  current.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  url.hash = current.hash;
  return url.toString();
}

function clearQueryFeedback() {
  const url = new URL(window.location.href);
  url.searchParams.delete("verified");
  url.searchParams.delete("updated");
  window.history.replaceState({}, "", url.toString());
}

function clearRecoveryState() {
  const url = new URL(window.location.href);
  url.searchParams.delete("mode");
  url.searchParams.delete("type");
  url.searchParams.delete("verified");
  url.searchParams.delete("code");
  url.searchParams.delete("token_hash");
  url.hash = "";
  window.history.replaceState({}, "", url.toString());
}
