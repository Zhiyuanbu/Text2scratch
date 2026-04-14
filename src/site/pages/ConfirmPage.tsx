import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { buildLoginUrl, ensureSupabaseConfigured, formatSupabaseError, supabaseClient } from "../lib/supabase";
import { isValidPasswordInput } from "../lib/security";
import { useAuth, useToast } from "../providers/AppProviders";

type ConfirmSeverity = "info" | "success" | "error";

export function ConfirmPage() {
  const { pushToast } = useToast();
  const { signOut } = useAuth();
  const [status, setStatus] = useState("Checking confirmation link...");
  const [severity, setSeverity] = useState<ConfirmSeverity>("info");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }

    processedRef.current = true;
    void handleConfirm();
  }, []);

  async function handleConfirm() {
    try {
      ensureSupabaseConfigured();
    } catch (error) {
      setStatus(formatSupabaseError(error));
      setSeverity("error");
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const tokenHash = search.get("token_hash") || hash.get("token_hash");
    const authCode = search.get("code") || hash.get("code");
    const type = search.get("type") || hash.get("type") || "signup";
    const mode = search.get("mode") || hash.get("mode");

    if (!tokenHash && !authCode) {
      if (mode === "recovery") {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
          setRecoveryReady(true);
          setStatus("Recovery session active. Set a new password.");
          setSeverity("success");
          return;
        }
      }

      setStatus("Incomplete verification link.");
      setSeverity("error");
      return;
    }

    try {
      if (authCode) {
        const { error } = await supabaseClient.auth.exchangeCodeForSession(authCode);
        if (error) {
          throw error;
        }
      } else if (tokenHash) {
        const { error } = await supabaseClient.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "recovery" | "invite" | "email" | "email_change" | "magiclink"
        });
        if (error) {
          throw error;
        }
      }

      if (type === "recovery" || mode === "recovery") {
        setRecoveryReady(true);
        setStatus("Identity verified. Set a new password below.");
        setSeverity("success");
        return;
      }

      setStatus("Email verified. Redirecting to login...");
      setSeverity("success");
      window.setTimeout(() => {
        window.location.assign(buildLoginStatusUrl("verified"));
      }, 2000);
    } catch (error) {
      setStatus(formatSupabaseError(error));
      setSeverity("error");
    }
  }

  const onUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== passwordConfirm) {
      pushToast({ title: "Mismatch", description: "Passwords do not match.", variant: "error" });
      return;
    }

    if (!isValidPasswordInput(password)) {
      pushToast({ title: "Too short", description: "Minimum 8 characters required.", variant: "warning" });
      return;
    }

    setIsPending(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      await signOut();
      pushToast({ title: "Password updated", description: "Redirecting to login.", variant: "success" });
      window.setTimeout(() => {
        window.location.assign(buildLoginStatusUrl("updated"));
      }, 1500);
    } catch (error) {
      pushToast({ title: "Update failed", description: formatSupabaseError(error), variant: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell page="confirm">
      <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden bg-[#f6f8fa] p-4 dark:bg-[#0d1117]">
        <div className="relative z-10 w-full max-w-[400px] animate-slide-up">
          <div className="mb-8 text-center">
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white transition-all duration-500 dark:ring-slate-800 ${
              severity === "error" ? "bg-rose-500" : "bg-[#4d97ff]"
            }`}>
              {severity === "error" ? <AlertCircle size={32} /> : severity === "success" ? <CheckCircle2 size={32} /> : <ShieldCheck size={32} />}
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Security Protocol</h1>
            <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">Authorization Verification</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-[#161b22]">
            <div className={`mb-6 rounded-lg border p-4 text-center ${
              severity === "success"
                ? "border-emerald-100 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/20 dark:bg-emerald-900/10"
                : severity === "error"
                  ? "border-rose-100 bg-rose-50/50 text-rose-700 dark:border-rose-900/20 dark:bg-rose-900/10"
                  : "border-blue-100 bg-blue-50/50 text-blue-700 dark:border-blue-900/20 dark:bg-blue-900/10"
            }`}
              role={severity === "error" ? "alert" : "status"}
              aria-live={severity === "error" ? "assertive" : "polite"}
              aria-atomic="true"
            >
              <p className="text-xs font-bold leading-relaxed">{status}</p>
            </div>

            {recoveryReady ? (
              <form onSubmit={onUpdatePassword} className="space-y-4">
                <PasswordField
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Minimum 8 characters"
                />
                <PasswordField
                  label="Confirm password"
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  placeholder="Repeat your new password"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-black uppercase text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Updating password..." : "Update Password"}
                </button>
              </form>
            ) : severity !== "success" ? (
              <div className="grid gap-2">
                <a href="login.html" className="flex items-center justify-center gap-2 rounded-lg bg-[#4d97ff] py-2 text-xs font-black uppercase text-white transition-all hover:bg-blue-600">
                  <LogIn size={14} /> System Login
                </a>
                <a href="signup.html" className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-black uppercase text-slate-600 dark:border-slate-700 dark:text-slate-400">
                  <UserPlus size={14} /> New Account
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[0.65rem] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
        placeholder={placeholder}
        required
      />
    </div>
  );
}

function buildLoginStatusUrl(status: "verified" | "updated") {
  const url = new URL(buildLoginUrl("login"));
  url.searchParams.set(status, "1");
  return url.toString();
}
