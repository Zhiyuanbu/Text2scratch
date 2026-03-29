import type { FormEvent } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Shield
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TurnstilePanel } from "../components/TurnstilePanel";
import { AppShell } from "../components/AppShell";
import {
  readPendingParentManagedSignup,
  storeAuthAudience,
  storePendingParentManagedSignup,
  type AuthAudience
} from "../lib/coppa";
import { type TurnstileController } from "../lib/turnstile";
import { useAuth, useToast } from "../providers/AppProviders";

type AuthStep = "age" | "form" | "recovery";

export function LoginPage() {
  return <AuthContainer mode="signin" />;
}

export function SignupPage() {
  return <AuthContainer mode="signup" />;
}

function AuthContainer({ mode }: { mode: "signin" | "signup" }) {
  const { user, signIn, signInWithGoogle, signUp, signOut, sendPasswordReset, updatePassword } = useAuth();
  const { pushToast } = useToast();
  const turnstileRef = useRef<TurnstileController | null>(null);
  
  const [step, setStep] = useState<AuthStep>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "recovery") return "recovery";
    return "age";
  });
  
  const [isReset, setIsReset] = useState(false);
  const [audience, setAudience] = useState<AuthAudience | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (user && step !== "recovery") window.location.replace("dashboard.html");
  }, [user, step]);

  const onAgeSelect = (selected: AuthAudience) => {
    setAudience(selected);
    storeAuthAudience(selected);
    setStep("form");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    try {
      if (step === "recovery") {
        if (recoveryPassword !== recoveryConfirm) throw new Error("Passwords mismatch.");
        await updatePassword(recoveryPassword);
        await signOut();
        window.location.assign("login.html?updated=1");
        return;
      }
      const captchaToken = turnstileRef.current?.getToken();
      if (mode === "signin") {
        if (!isReset) {
          await signIn(identifier, password, captchaToken);
          window.location.assign("dashboard.html");
        } else {
          await sendPasswordReset(identifier, captchaToken);
          pushToast({ title: "Email sent", description: "Check your inbox.", variant: "success" });
        }
      } else {
        if (audience === "under_13") {
          storePendingParentManagedSignup({ requestedUsername: username, parentEmail: email });
          pushToast({ title: "Saved", description: "Parent must complete setup.", variant: "success" });
          setStep("age");
        } else {
          await signUp({
            username, email, password, captchaToken,
            ageBand: "13_or_over",
            accountRole: audience === "parent_guardian" ? "parent_guardian" : "standard"
          });
          pushToast({ title: "Account created", description: "Verify your email.", variant: "success" });
        }
      }
    } catch (error) {
      pushToast({ title: "Error", description: String(error), variant: "error" });
    } finally { setIsPending(false); }
  };

  return (
    <AppShell page={mode}>
      <div className="flex h-full items-center justify-center bg-[#f6f8fa] p-4 dark:bg-[#0d1117]">
        <div className="w-full max-w-[340px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4d97ff] text-white shadow-sm">
              <Shield size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in to text2scratch" : "Join the community"}
            </h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            {step === "age" && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Age Group</p>
                <div className="grid gap-2">
                  <AgeSelectButton label="Adult (18+)" onClick={() => onAgeSelect("adult")} />
                  <AgeSelectButton label="Teen (13-17)" onClick={() => onAgeSelect("teen_13_to_17")} />
                  <AgeSelectButton label="Under 13" onClick={() => onAgeSelect("under_13")} />
                  <AgeSelectButton label="Parent/Guardian" onClick={() => onAgeSelect("parent_guardian")} />
                </div>
              </div>
            )}

            {step === "form" && (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep("age")} className="flex items-center gap-1 text-[0.7rem] font-bold text-blue-600 hover:underline">
                    <ArrowLeft size={12} /> CHANGE AGE
                  </button>
                  <span className="text-[0.7rem] font-bold uppercase text-slate-400">{audience?.replace("_", " ")}</span>
                </div>

                <button 
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <GoogleLogo className="h-4 w-4" /> Continue with Google
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  <span className="mx-2 text-[0.6rem] font-bold uppercase text-slate-400">or</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                </div>

                {mode === "signin" ? (
                  <AuthInput label="Username or email" value={identifier} onChange={setIdentifier} />
                ) : (
                  <>
                    <AuthInput label="Username" value={username} onChange={setUsername} />
                    <AuthInput label="Email" value={email} onChange={setEmail} type="email" />
                  </>
                )}

                {!isReset && (
                  <AuthInput label="Password" value={password} onChange={setPassword} type="password" />
                )}

                <div className="py-1">
                  <TurnstilePanel controllerRef={turnstileRef} actionLabel="auth" />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-md bg-[#2da44e] py-2 text-sm font-bold text-white hover:bg-[#2c974b] disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Connecting..." : (mode === "signin" ? (isReset ? "Send reset link" : "Sign in") : "Create account")}
                </button>

                {mode === "signin" && (
                  <button type="button" onClick={() => setIsReset(!isReset)} className="w-full text-center text-xs font-medium text-blue-600 hover:underline">
                    {isReset ? "Return to sign in" : "Forgot password?"}
                  </button>
                )}
              </form>
            )}

            {step === "recovery" && (
              <form onSubmit={onSubmit} className="space-y-4">
                <AuthInput label="New password" value={recoveryPassword} onChange={setRecoveryPassword} type="password" />
                <AuthInput label="Confirm password" value={recoveryConfirm} onChange={setRecoveryConfirm} type="password" />
                <button type="submit" className="w-full rounded-md bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700">Update Password</button>
              </form>
            )}
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-[#f6f8fa]/50 p-4 text-center dark:border-slate-800 dark:bg-transparent">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {mode === "signin" ? "New to text2scratch?" : "Already have an account?"}{" "}
              <a href={mode === "signin" ? "signup.html" : "login.html"} className="font-bold text-blue-600 hover:underline">
                {mode === "signin" ? "Create an account" : "Sign in"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AgeSelectButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-transparent dark:hover:bg-slate-800 transition-all">
      {label} <ChevronRight size={14} className="text-slate-300" />
    </button>
  );
}

function AuthInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [visible, setVisible] = useState(false);
  const isPass = type === "password";
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={isPass ? (visible ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 transition-all"
          required
        />
        {isPass && (
          <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
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
