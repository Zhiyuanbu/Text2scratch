import type { FormEvent, ReactNode } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  UserRound,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HcaptchaPanel } from "../components/HcaptchaPanel";
import { AppShell } from "../components/AppShell";
import {
  clearPendingParentManagedSignup,
  readPendingParentManagedSignup,
  storeAuthAudience,
  storePendingParentManagedSignup,
  type AuthAudience
} from "../lib/coppa";
import { isCaptchaError, type HcaptchaController } from "../lib/hcaptcha";
import { buildLoginUrl, isValidUsername, normalizeUsername } from "../lib/supabase";
import { useAuth, useToast } from "../providers/AppProviders";

type AuthStep = "age" | "options" | "email" | "recovery";
type LoginMode = "signin" | "reset" | "recovery";

export function LoginPage() {
  return <AuthContainer mode="signin" />;
}

export function SignupPage() {
  return <AuthContainer mode="signup" />;
}

function AuthContainer({ mode: initialMode }: { mode: "signin" | "signup" }) {
  const { user, signIn, signInWithGoogle, signUp, signOut, sendPasswordReset, updatePassword } = useAuth();
  const { pushToast } = useToast();
  const captchaRef = useRef<HcaptchaController | null>(null);
  
  const [step, setStep] = useState<AuthStep>(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (params.get("mode") === "recovery" || params.get("type") === "recovery" || hash.includes("type=recovery")) {
      return "recovery";
    }
    return "age";
  });
  
  const [loginMode, setLoginMode] = useState<LoginMode>(initialMode === "signin" ? "signin" : "signin");
  const [audience, setAudience] = useState<AuthAudience | null>(null);
  
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user && step !== "recovery") {
      window.location.replace("dashboard.html");
    }
  }, [user, step]);

  const onAgeSelect = (selected: AuthAudience) => {
    setAudience(selected);
    storeAuthAudience(selected);
    setStep("options");
  };

  const onGoogleAuth = async () => {
    setIsPending(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      pushToast({
        title: "Google Auth Failed",
        description: error instanceof Error ? error.message : "Connection error.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      if (step === "recovery") {
        if (recoveryPassword.length < 6) throw new Error("Password too short.");
        if (recoveryPassword !== recoveryConfirm) throw new Error("Passwords do not match.");
        await updatePassword(recoveryPassword);
        await signOut();
        window.location.assign("login.html?updated=1");
        return;
      }

      const captchaToken = captchaRef.current?.getToken();

      if (initialMode === "signin") {
        if (loginMode === "signin") {
          await signIn(identifier, password, captchaToken);
          window.location.assign("dashboard.html");
        } else {
          await sendPasswordReset(identifier, captchaToken);
          pushToast({ title: "Reset link sent", description: "Check your inbox.", variant: "success" });
        }
      } else {
        if (audience === "under_13") {
          // Handle parent handoff step
          storePendingParentManagedSignup({ requestedUsername: username, parentEmail: email });
          pushToast({ title: "Request Saved", description: "Let a parent finish on this device.", variant: "success" });
          setStep("age");
        } else {
          const result = await signUp({
            username,
            email,
            password,
            captchaToken,
            ageBand: "13_or_over",
            accountRole: audience === "parent_guardian" ? "parent_guardian" : "standard"
          });
          if (result.needsEmailVerification) {
            pushToast({ title: "Verification required", description: "Check your email to confirm.", variant: "success" });
          } else {
            window.location.assign("dashboard.html");
          }
        }
      }
    } catch (error) {
      if (isCaptchaError(error)) captchaRef.current?.reset({ clearCache: true });
      pushToast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell page={initialMode}>
      <section className="mx-auto flex min-h-[85vh] w-full max-w-6xl items-center px-6 py-12 lg:py-20">
        <div className="grid w-full gap-16 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col justify-center space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-blue-50/50 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-blue-600 backdrop-blur-sm dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
                Secure Identity Protocol
              </span>
              <h1 className="text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white xl:text-7xl">
                {step === "age" ? "Welcome back." : initialMode === "signin" ? "Sign in to text2scratch." : "Create your account."}
              </h1>
              <p className="max-w-xl text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                {step === "age" 
                  ? "Select your age bracket to initialize the correct authoring environment and safety controls."
                  : "Access your cloud workspace, shared projects, and premium authoring tools."}
              </p>
            </div>

            <div className="hidden grid-cols-2 gap-6 lg:grid">
              <div className="rounded-[2rem] border border-slate-100 bg-white/50 p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-slate-950 dark:text-white">Instant Sync</h3>
                <p className="mt-2 text-sm text-slate-500">Your projects follow you across every device.</p>
              </div>
              <div className="rounded-[2rem] border border-slate-100 bg-white/50 p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-slate-950 dark:text-white">Safety First</h3>
                <p className="mt-2 text-sm text-slate-500">Industry standard COPPA compliant protection.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Animated Glow Effect */}
            <div className="absolute -inset-4 z-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-3xl opacity-50 dark:opacity-30"></div>
            
            <div className="relative z-10 overflow-hidden rounded-[3rem] border border-slate-200/60 bg-white/90 p-8 shadow-[0_40px_100px_rgba(15,23,42,0.1)] backdrop-blur-2xl transition-all duration-500 dark:border-slate-800/60 dark:bg-slate-950/80">
              {step === "age" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">Verify Age</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500 uppercase tracking-widest">Initial Selection</p>
                  </div>
                  
                  <div className="grid gap-3">
                    <AgeButton label="Adult (18+)" description="Standard full access" onClick={() => onAgeSelect("adult")} />
                    <AgeButton label="Teen (13-17)" description="Standard with safety focus" onClick={() => onAgeSelect("teen_13_to_17")} />
                    <AgeButton label="Under 13" description="Parent-managed flow" onClick={() => onAgeSelect("under_13")} />
                    <AgeButton label="Parent/Guardian" description="Manage child accounts" onClick={() => onAgeSelect("parent_guardian")} />
                  </div>

                  <div className="text-center pt-4 border-t border-slate-100 dark:border-white/5">
                    <a href={initialMode === "signin" ? "signup.html" : "login.html"} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                      {initialMode === "signin" ? "Don't have an account?" : "Already have an account?"}
                    </a>
                  </div>
                </div>
              )}

              {step === "options" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <button onClick={() => setStep("age")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                      {initialMode === "signin" ? "Welcome Back" : "Identity Setup"}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-blue-600 uppercase tracking-[0.2em]">{audience?.replace("_", " ")}</p>
                  </div>

                  <div className="grid gap-4">
                    <button 
                      onClick={onGoogleAuth}
                      disabled={isPending}
                      className="group relative flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      <GoogleLogo className="h-5 w-5" />
                      Continue with Google
                    </button>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-100 dark:border-white/5"></div>
                      <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">or use email</span>
                      <div className="flex-grow border-t border-slate-100 dark:border-white/5"></div>
                    </div>

                    <button 
                      onClick={() => setStep("email")}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        {initialMode === "signin" ? "Sign in with Email" : "Sign up with Email"}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              )}

              {step === "email" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep("options")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    {initialMode === "signin" && (
                      <button 
                        onClick={() => setLoginMode(loginMode === "signin" ? "reset" : "signin")}
                        className="text-xs font-bold text-blue-600 uppercase tracking-widest"
                      >
                        {loginMode === "signin" ? "Forgot?" : "Sign in"}
                      </button>
                    )}
                  </div>

                  <form onSubmit={onSubmit} className="grid gap-5">
                    {initialMode === "signin" ? (
                      <Input
                        label="Identity"
                        icon={<Fingerprint className="h-4 w-4" />}
                        placeholder="Email or username"
                        value={identifier}
                        onChange={setIdentifier}
                        autoComplete="username"
                      />
                    ) : (
                      <>
                        <Input
                          label="Preferred Username"
                          icon={<UserRound className="h-4 w-4" />}
                          placeholder="project_author"
                          value={username}
                          onChange={setUsername}
                          autoComplete="username"
                        />
                        <Input
                          label="Email Address"
                          icon={<Mail className="h-4 w-4" />}
                          type="email"
                          placeholder="you@domain.com"
                          value={email}
                          onChange={setEmail}
                          autoComplete="email"
                        />
                      </>
                    )}

                    {loginMode === "signin" && (
                      <Input
                        label="Security Key"
                        icon={<KeyRound className="h-4 w-4" />}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                        autoComplete={initialMode === "signin" ? "current-password" : "new-password"}
                      />
                    )}

                    <div className="pt-2">
                      <HcaptchaPanel controllerRef={captchaRef} actionLabel="verification" />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-950 px-6 py-4 text-[1rem] font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      {isPending ? "Connecting..." : (
                        <>
                          {initialMode === "signin" 
                            ? (loginMode === "signin" ? "Initialize Session" : "Send Reset Link") 
                            : (audience === "under_13" ? "Save Handoff" : "Create Core Account")}
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {step === "recovery" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">Reset Security</h2>
                    <p className="mt-2 text-sm font-bold text-blue-600 uppercase tracking-widest">Protocol Recovery</p>
                  </div>
                  <form onSubmit={onSubmit} className="grid gap-5">
                    <Input
                      label="New Security Key"
                      type="password"
                      icon={<KeyRound className="h-4 w-4" />}
                      placeholder="••••••••"
                      value={recoveryPassword}
                      onChange={setRecoveryPassword}
                    />
                    <Input
                      label="Confirm Key"
                      type="password"
                      icon={<KeyRound className="h-4 w-4" />}
                      placeholder="••••••••"
                      value={recoveryConfirm}
                      onChange={setRecoveryConfirm}
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-blue-700"
                    >
                      {isPending ? "Updating..." : "Authorize Update"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function AgeButton({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-600/30 hover:shadow-md dark:border-white/5 dark:bg-white/5"
    >
      <div>
        <p className="text-[1.05rem] font-bold text-slate-950 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
    </button>
  );
}

function Input({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  icon, 
  autoComplete 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder: string; 
  type?: string; 
  icon?: ReactNode;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const finalType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <label className="block space-y-2">
      <span className="text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</span>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600">
          {icon}
        </div>
        <input
          type={finalType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-12 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
          required
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    </svg>
  );
}
