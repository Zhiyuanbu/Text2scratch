import type { FormEvent, ReactNode } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useAuth, useToast } from "../providers/AppProviders";

export function LoginPage() {
  const { user, signIn, sendPasswordReset } = useAuth();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [identifier, setIdentifier] = useState("");
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
      if (mode === "signin") {
        await signIn(identifier, password);
        pushToast({
          title: "Signed in",
          description: "Your session is ready. Opening the dashboard now.",
          variant: "success"
        });
        window.setTimeout(() => {
          window.location.assign("dashboard.html");
        }, 300);
      } else {
        await sendPasswordReset(identifier);
        pushToast({
          title: "Password reset sent",
          description: "Check your inbox for the recovery link.",
          variant: "success"
        });
      }
    } catch (error) {
      pushToast({
        title: mode === "signin" ? "Login failed" : "Reset failed",
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
        badge="Secure account access"
        title="Access your workspace without the rushed, throwaway auth flow."
        description="Use your email or username to sign in. The dashboard consolidates profile, appearance, and security management into one place after login."
        accent="Sign in"
        sideTitle="What you unlock"
        sideItems={[
          "Cloud save and cross-device project access.",
          "A single dashboard for profile, appearance, and security.",
          "Top-fixed toasts and clearer feedback for account actions."
        ]}
      >
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <AuthSwitch current="login" />

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

          <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
            <TextField
              label={mode === "signin" ? "Email or username" : "Account email or username"}
              value={identifier}
              onChange={setIdentifier}
              placeholder="you@example.com or username"
              autoComplete="username"
            />

            {mode === "signin" ? (
              <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isPending ? "Working..." : mode === "signin" ? "Log in" : "Send reset link"}
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
      const result = await signUp({ username, email, password });
      pushToast({
        title: "Account created",
        description: result.needsEmailVerification
          ? "Check your inbox to confirm your email before logging in."
          : "Your dashboard is ready.",
        variant: "success"
      });

      if (result.needsEmailVerification) {
        window.setTimeout(() => {
          window.location.assign("login.html");
        }, 400);
      } else {
        window.setTimeout(() => {
          window.location.assign("dashboard.html");
        }, 400);
      }
    } catch (error) {
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
        badge="Create a production-ready account"
        title="Sign up once, then manage everything from a single dashboard."
        description="Create a stable username for shareable projects, keep your appearance preferences in one place, and avoid the fragmented account pages."
        accent="Sign up"
        sideTitle="Built for serious usage"
        sideItems={[
          "A single account hub instead of separate profile and settings pages.",
          "Consistent top navigation with login and signup always available.",
          "Cleaner validation and feedback throughout the auth flow."
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
            <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />

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
          <BenefitStat icon={<Sparkles className="h-5 w-5" />} title="Premium flow" description="Minimal, high-contrast surfaces with immediate top-fixed feedback." />
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
  value,
  onChange,
  autoComplete
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      Password
      <span className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your password"
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
