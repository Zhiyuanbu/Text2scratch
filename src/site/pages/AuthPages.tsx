import type { FormEvent, ReactNode } from "react";
import { Eye, EyeOff, HeartHandshake, KeyRound, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HcaptchaPanel } from "../components/HcaptchaPanel";
import { AppShell } from "../components/AppShell";
import {
  clearPendingParentManagedSignup,
  readPendingParentManagedSignup,
  readStoredAuthAudience,
  storeAuthAudience,
  storePendingParentManagedSignup,
  type AuthAudience
} from "../lib/coppa";
import { isCaptchaError, type HcaptchaController } from "../lib/hcaptcha";
import { buildLoginUrl, isValidUsername, normalizeUsername } from "../lib/supabase";
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
  const [audience, setAudience] = useState<AuthAudience>(() => readInitialAuthAudience());
  const [pendingChildRequest] = useState(() => readPendingParentManagedSignup());

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
  }, [pushToast]);

  useEffect(() => {
    storeAuthAudience(audience);
  }, [audience]);

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

  const loginCopy = getLoginCopy(mode, audience);

  return (
    <AppShell page="login">
      <AuthFrame
        page="login"
        badge={loginCopy.badge}
        title={loginCopy.title}
        description={loginCopy.description}
        accent={loginCopy.accent}
        sideTitle={loginCopy.sideTitle}
        sideItems={loginCopy.sideItems}
      >
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <AuthSwitch current="login" />

          {mode !== "recovery" ? (
            <AudienceGate current={audience} onChange={setAudience} />
          ) : null}

          {mode !== "recovery" ? (
            <AudienceNotice
              audience={audience}
              pendingChildRequest={pendingChildRequest}
              context="login"
              onSwitchToParent={() => setAudience("parent_guardian")}
            />
          ) : null}

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
  const [audience, setAudience] = useState<AuthAudience>(() => readInitialAuthAudience());
  const [pendingChildRequest, setPendingChildRequest] = useState(() => readPendingParentManagedSignup());
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestParentEmail, setRequestParentEmail] = useState(() => readPendingParentManagedSignup()?.parentEmail || "");
  const [requestUsername, setRequestUsername] = useState(() => readPendingParentManagedSignup()?.requestedUsername || "");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user) {
      window.location.replace("dashboard.html");
    }
  }, [user]);

  useEffect(() => {
    storeAuthAudience(audience);
  }, [audience]);

  const saveParentHandoff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = normalizeUsername(requestUsername);
    const normalizedParentEmail = requestParentEmail.trim().toLowerCase();

    try {
      if (!isValidUsername(normalizedUsername)) {
        throw new Error("Choose a username with 3 to 32 lowercase letters, numbers, or underscores.");
      }
      if (!isLikelyEmail(normalizedParentEmail)) {
        throw new Error("Enter a valid parent or guardian email.");
      }

      const nextRequest = storePendingParentManagedSignup({
        requestedUsername: normalizedUsername,
        parentEmail: normalizedParentEmail
      });

      setRequestUsername(normalizedUsername);
      setRequestParentEmail(normalizedParentEmail);
      setPendingChildRequest(nextRequest);
      pushToast({
        title: "Parent step saved",
        description: "Hand the device to a parent or guardian so they can finish account creation.",
        variant: "success"
      });
    } catch (error) {
      pushToast({
        title: "Could not save parent step",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      const captchaToken = requireCaptchaToken(captchaRef.current, "creating an account");
      const result = await signUp({
        username,
        email,
        password,
        captchaToken,
        ageBand: "13_or_over",
        accountRole: audience === "parent_guardian" ? "parent_guardian" : "standard"
      });

      pushToast({
        title: audience === "parent_guardian"
          ? "Parent account created"
          : audience === "teen_13_to_17"
            ? "13+ account created"
            : "Adult account created",
        description: result.needsEmailVerification
          ? audience === "parent_guardian"
            ? "Check the parent email inbox to confirm your account, then sign in and open Parent controls to review the child request on this device."
            : "Check your inbox to confirm your email before logging in."
          : audience === "parent_guardian"
            ? "Your parent account is ready. Sign in and open Parent controls to review the child request on this device."
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

  const signupCopy = getSignupCopy(audience);

  return (
    <AppShell page="signup">
      <AuthFrame
        page="signup"
        badge={signupCopy.badge}
        title={signupCopy.title}
        description={signupCopy.description}
        accent={signupCopy.accent}
        sideTitle={signupCopy.sideTitle}
        sideItems={signupCopy.sideItems}
      >
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <AuthSwitch current="signup" />
          <AudienceGate current={audience} onChange={setAudience} />

          {audience === "under_13" ? (
            <div className="mt-8 space-y-5">
              <AudienceNotice
                audience={audience}
                pendingChildRequest={pendingChildRequest}
                context="signup"
                onSwitchToParent={() => setAudience("parent_guardian")}
              />

              <form className="grid gap-5" onSubmit={saveParentHandoff}>
                <TextField
                  label="Requested username"
                  value={requestUsername}
                  onChange={setRequestUsername}
                  placeholder="project_builder"
                  autoComplete="username"
                />
                <TextField
                  label="Parent or guardian email"
                  value={requestParentEmail}
                  onChange={setRequestParentEmail}
                  placeholder="parent@example.com"
                  type="email"
                  autoComplete="email"
                />

                <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                  This step stays on this device until a parent or guardian finishes signup. It does not create an account yet.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    Save parent step
                  </button>
                  {pendingChildRequest ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearPendingParentManagedSignup();
                        setPendingChildRequest(null);
                        setRequestUsername("");
                        setRequestParentEmail("");
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
                    >
                      Clear saved step
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          ) : (
            <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
              <AudienceNotice
                audience={audience}
                pendingChildRequest={pendingChildRequest}
                context="signup"
                onSwitchToParent={() => setAudience("parent_guardian")}
              />

              <TextField
                label={audience === "parent_guardian" ? "Parent account username" : "Username"}
                value={username}
                onChange={setUsername}
                placeholder="project_builder"
                autoComplete="username"
              />
              <TextField
                label={audience === "parent_guardian" ? "Parent or guardian email" : "Email"}
                value={email}
                onChange={setEmail}
                placeholder={audience === "parent_guardian" ? "parent@example.com" : "you@example.com"}
                type="email"
                autoComplete="email"
              />
              <PasswordField
                label={audience === "parent_guardian" ? "Parent account password" : "Password"}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Create a password"
              />

              <HcaptchaPanel controllerRef={captchaRef} actionLabel="creating an account" />

              <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                {audience === "parent_guardian"
                  ? "Create your own parent or guardian account first. After login, use Parent controls in the dashboard to review the child request on this device and continue the child-account flow."
                  : audience === "teen_13_to_17"
                    ? "This standard 13+ account is for users ages 13 to 17. Usernames are normalized to lowercase letters, numbers, and underscores, and email confirmation may be required depending on your Supabase auth settings."
                    : "This standard adult account is for users 18 and older. Usernames are normalized to lowercase letters, numbers, and underscores, and email confirmation may be required depending on your Supabase auth settings."}
              </p>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {isPending
                  ? audience === "parent_guardian"
                    ? "Creating parent account..."
                    : audience === "teen_13_to_17"
                      ? "Creating 13+ account..."
                      : "Creating adult account..."
                  : audience === "parent_guardian"
                    ? "Create parent account"
                    : audience === "teen_13_to_17"
                      ? "Create 13+ account"
                      : "Create adult account"}
              </button>
            </form>
          )}
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

function AudienceGate({
  current,
  onChange
}: {
  current: AuthAudience;
  onChange: (value: AuthAudience) => void;
}) {
  return (
    <div className="mt-6 grid gap-3" aria-label="Age and account flow">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Choose the account type you need</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AudienceOption
          title="Adult"
          description="Standard self-serve account for adults 18 and older."
          active={current === "adult"}
          onClick={() => onChange("adult")}
        />
        <AudienceOption
          title="13 to 17"
          description="Standard account for teens who are at least 13."
          active={current === "teen_13_to_17"}
          onClick={() => onChange("teen_13_to_17")}
        />
        <AudienceOption
          title="Under 13"
          description="Start a parent handoff before any hosted account is created."
          active={current === "under_13"}
          onClick={() => onChange("under_13")}
        />
        <AudienceOption
          title="Parent account"
          description="Create a separate parent or guardian account."
          active={current === "parent_guardian"}
          onClick={() => onChange("parent_guardian")}
        />
      </div>
    </div>
  );
}

function AudienceOption({
  title,
  description,
  active,
  onClick
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-white dark:bg-white dark:text-slate-950"
          : "border-black/10 bg-slate-50 text-slate-700 hover:border-slate-950 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white dark:hover:bg-white/10 dark:hover:text-white"
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className={`mt-2 text-sm leading-6 ${active ? "text-white/80 dark:text-slate-700" : "text-slate-500 dark:text-slate-400"}`}>{description}</p>
    </button>
  );
}

function AudienceNotice({
  audience,
  pendingChildRequest,
  context,
  onSwitchToParent
}: {
  audience: AuthAudience;
  pendingChildRequest: ReturnType<typeof readPendingParentManagedSignup>;
  context: "login" | "signup";
  onSwitchToParent: () => void;
}) {
  if (isStandardAudience(audience)) {
    return null;
  }

  if (audience === "under_13") {
    return (
      <article className="mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-white/80 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200">
            <HeartHandshake className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Under-13 users need a parent-managed account.</p>
            <p className="mt-2">
              {context === "login"
                ? "Sign in only to a child account that a parent or guardian already approved. If a parent has not created their own account and reviewed your request yet, start the parent handoff first."
                : "A parent or guardian must create their own account before they can review and continue a child-account request. Start the parent handoff below, then let the parent or guardian continue."}
            </p>
            {pendingChildRequest ? (
              <p className="mt-2">
                Saved on this device: username <strong>{pendingChildRequest.requestedUsername}</strong>, parent email <strong>{pendingChildRequest.parentEmail}</strong>.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSwitchToParent}
                className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white px-4 py-2 font-semibold text-sky-900 transition hover:border-sky-500 hover:text-sky-950 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100 dark:hover:border-sky-300"
              >
                <Mail className="h-4 w-4" />
                Parent or guardian continues
              </button>
              {context === "login" ? (
                <a
                  href="signup.html"
                  className="inline-flex items-center rounded-full border border-sky-300 px-4 py-2 font-semibold text-sky-900 transition hover:border-sky-500 hover:text-sky-950 dark:border-sky-400/30 dark:text-sky-100 dark:hover:border-sky-300"
                >
                  Start signup instead
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <HeartHandshake className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Parent or guardian controls this account flow.</p>
          <p className="mt-2">
            {context === "login"
              ? "Use your own parent or guardian account to sign in. From there, review any saved child-account request on this device and continue the child flow."
              : "Create your own parent or guardian account first. After login, use the dashboard Parent controls tab to review any saved child-account request and continue."}
          </p>
          {pendingChildRequest ? (
            <p className="mt-2">
              Pending handoff found on this device for <strong>{pendingChildRequest.requestedUsername}</strong> using <strong>{pendingChildRequest.parentEmail}</strong>.
            </p>
          ) : null}
        </div>
      </div>
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

function readInitialAuthAudience() {
  return readStoredAuthAudience() || "adult";
}

function getLoginCopy(mode: LoginMode, audience: AuthAudience) {
  if (mode === "recovery") {
    return {
      badge: "Recovery session",
      title: "Set a new password to finish the recovery flow.",
      description: "The recovery link has already handled identity verification. Choose a new password and return to the normal sign-in flow.",
      accent: "Recovery",
      sideTitle: "After recovery",
      sideItems: [
        "Choose a new password and return to standard sign-in.",
        "Account email verification has already been handled by the recovery link.",
        "Use the dashboard after login to review account settings."
      ]
    };
  }

  if (audience === "under_13") {
    return {
      badge: "Parent-managed access",
      title: "Sign in to a parent-managed account.",
      description: "Under-13 users can use hosted features only through separate child accounts that a parent or guardian has already approved and created.",
      accent: "Under 13",
      sideTitle: "How access works",
      sideItems: [
        "Use the approved child username or child-account email to sign in.",
        "A parent or guardian should create their own account before they continue any child-account request.",
        "If no child account exists yet, start the under-13 request flow first."
      ]
    };
  }

  if (audience === "parent_guardian") {
    return {
      badge: "Parent or guardian access",
      title: "Sign in to your parent or guardian account.",
      description: "Parents and guardians should use their own account to review child-account requests, manage linked child controls, and handle recovery or deletion actions.",
      accent: "Parent access",
      sideTitle: "What you control",
      sideItems: [
        "Parent accounts stay separate from child accounts.",
        "The dashboard can be used to review child-account requests and parent-policy links.",
        "Recovery and deletion actions remain available from the parent account."
      ]
    };
  }

  if (audience === "teen_13_to_17") {
    return {
      badge: "13+ account access",
      title: "Sign in to your 13+ account.",
      description: "Use the standard login flow if you are at least 13. Your account can use cloud save, sharing, and dashboard settings without the parent-account flow.",
      accent: "Age 13 to 17",
      sideTitle: "After you sign in",
      sideItems: [
        "Open the dashboard to manage profile, appearance, and security settings.",
        "Use your own email or username to access saved projects.",
        "Password reset and verification stay tied to your own account email."
      ]
    };
  }

  return {
    badge: "Adult account access",
    title: "Sign in to your adult account.",
    description: "Use your email or username to sign in. Adult accounts use the standard hosted flow for cloud save, sharing, and dashboard settings.",
    accent: "Adult access",
    sideTitle: "After you sign in",
    sideItems: [
      "Cloud save and cross-device project access.",
      "Profile, appearance, and security controls in one dashboard.",
      "Captcha-protected auth actions."
    ]
  };
}

function getSignupCopy(audience: AuthAudience) {
  if (audience === "adult") {
    return {
      badge: "Create adult account",
      title: "Create an adult account for your own projects.",
      description: "Adults 18 and older can use the standard signup flow for cloud save, sharing, and account settings.",
      accent: "Adult signup",
      sideTitle: "What you get",
      sideItems: [
        "One standard account for your own projects and dashboard settings.",
        "Email verification and password reset stay tied to your own email.",
        "No parent-account handoff is required."
      ]
    };
  }

  if (audience === "teen_13_to_17") {
    return {
      badge: "Create 13+ account",
      title: "Create a standard account if you are at least 13.",
      description: "Users ages 13 to 17 can use the standard signup flow for cloud save, sharing, and account settings.",
      accent: "Age 13 to 17",
      sideTitle: "What you get",
      sideItems: [
        "A standard hosted account for your own projects.",
        "The same dashboard, sharing, and security controls as other 13+ accounts.",
        "No parent-account handoff is required for this age group."
      ]
    };
  }

  if (audience === "under_13") {
    return {
      badge: "Parent-managed signup",
      title: "Start signup with a parent or guardian.",
      description: "Children under 13 can use hosted features only after a parent or guardian creates their own account and reviews the child-account request saved on this device.",
      accent: "Under 13",
      sideTitle: "What happens next",
      sideItems: [
        "Save the requested username and parent email on this device.",
        "A parent or guardian creates their own account first.",
        "After the parent signs in, they can continue the separate child-account flow from the dashboard."
      ]
    };
  }

  if (audience === "parent_guardian") {
    return {
      badge: "Create parent account",
      title: "Create your own parent or guardian account first.",
      description: "Parent accounts stay separate from child accounts. Create your own account first, then sign in and review any child-account request saved on this device from the dashboard.",
      accent: "Parent signup",
      sideTitle: "What you confirm",
      sideItems: [
        "The parent or guardian controls the email on the parent account.",
        "Child requests are reviewed after the parent signs in.",
        "Parents retain review and deletion controls through the dashboard."
      ]
    };
  }

  return {
    badge: "Create parent account",
    title: "Create your own parent or guardian account first.",
    description: "Parent accounts stay separate from child accounts. Create your own account first, then sign in and review any child-account request saved on this device from the dashboard.",
    accent: "Parent signup",
    sideTitle: "What you confirm",
    sideItems: [
      "The parent or guardian controls the email on the parent account.",
      "Child requests are reviewed after the parent signs in.",
      "Parents retain review and deletion controls through the dashboard."
    ]
  };
}

function isStandardAudience(audience: AuthAudience) {
  return audience === "adult" || audience === "teen_13_to_17";
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
