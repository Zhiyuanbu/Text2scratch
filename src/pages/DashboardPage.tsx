import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Palette,
  ShieldAlert,
  SunMedium,
  UserRound
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { showConfirmDialog } from "../../dialog-client.js";
import { AppShell } from "../components/AppShell";
import { HcaptchaPanel } from "../components/HcaptchaPanel";
import { isCaptchaError, type HcaptchaController } from "../lib/hcaptcha";
import { buildAvatarLabel, formatDate, formatDateTime } from "../lib/supabase";
import { useAuth, useTheme, useToast } from "../providers/AppProviders";

type DashboardTab = "overview" | "profile" | "appearance" | "security";

const tabs: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <ShieldAlert className="h-4 w-4" /> }
];

export function DashboardPage() {
  const { user, profile, isLoading, updateUsername, sendPasswordResetForCurrentUser, signOut, deleteCurrentAccount } = useAuth();
  const { mode, setMode } = useTheme();
  const { pushToast } = useToast();
  const captchaRef = useRef<HcaptchaController | null>(null);
  const [tab, setTab] = useState<DashboardTab>(() => readTabFromHash());
  const [username, setUsername] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const onHashChange = () => setTab(readTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setUsername(profile?.username || "");
  }, [profile?.username]);

  const displayName = profile?.username || String(user?.user_metadata?.username || "").trim() || user?.email?.split("@")[0] || "Guest";
  const displayEmail = user?.email || profile?.email || "";

  const selectTab = (nextTab: DashboardTab) => {
    setTab(nextTab);
    if (window.location.hash !== `#${nextTab}`) {
      window.history.replaceState(null, "", `#${nextTab}`);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    try {
      await updateUsername(username);
      pushToast({
        title: "Profile updated",
        description: "Your username has been saved.",
        variant: "success"
      });
    } catch (error) {
      pushToast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  const sendReset = async () => {
    setIsPending(true);
    try {
      const captchaToken = requireCaptchaToken(captchaRef.current, "sending a reset email");
      await sendPasswordResetForCurrentUser(captchaToken);
      pushToast({
        title: "Reset email sent",
        description: "Check your inbox for the password recovery link.",
        variant: "success"
      });
    } catch (error) {
      if (isCaptchaError(error)) {
        captchaRef.current?.reset({ clearCache: true });
      }
      pushToast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      await signOut();
      pushToast({
        title: "Signed out",
        description: "Your session has been closed.",
        variant: "success"
      });
      window.setTimeout(() => {
        window.location.assign("index.html");
      }, 250);
    } catch (error) {
      pushToast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: "Delete account?",
      message: "Delete this account permanently? This action cannot be undone.",
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    setIsPending(true);
    try {
      await deleteCurrentAccount();
      pushToast({
        title: "Account deleted",
        description: "The current account has been removed.",
        variant: "success"
      });
      window.setTimeout(() => {
        window.location.assign("index.html");
      }, 250);
    } catch (error) {
      pushToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error"
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell page="dashboard">
      <section className="hero-glow border-b border-black/5 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">Manage your account settings in one place.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Update your username, switch theme, send reset emails, and jump back into the editor without hopping through separate pages.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            {user ? (
              <>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white dark:bg-white dark:text-slate-950">
                    {buildAvatarLabel(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
                    <p className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white" title={displayName}>{displayName}</p>
                    {displayEmail ? (
                      <p className="break-all text-sm text-slate-600 dark:text-slate-300">{displayEmail}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <QuickLink href="converter.html" title="Open workspace" description="Keep working on the current project." />
                  <QuickLink href="reference.html" title="Browse reference" description="Look up exact command syntax." />
                  <QuickLink href="docs.html" title="Read docs" description="Review project structure and examples." />
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Guest session</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in to unlock dashboard controls.</h2>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  You can still use the workspace without an account, but cloud save, share links, and identity settings require authentication.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="login.html" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                    Log in
                  </a>
                  <a href="signup.html" className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                    Sign up
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !user ? (
          <GuestDashboard />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="grid gap-3 self-start rounded-[2rem] border border-black/10 bg-white/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
              {tabs.map((item) => {
                const active = item.id === tab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-slate-950 text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </aside>

            <div className="min-w-0">
              {tab === "overview" ? (
                <OverviewPanel profileName={displayName} profileEmail={displayEmail} profile={profile} />
              ) : null}
              {tab === "profile" ? (
                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <article className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_20px_48px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white dark:text-slate-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Profile preview</p>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/10 text-2xl font-semibold text-white dark:bg-slate-950/10 dark:text-slate-950">
                        {buildAvatarLabel(displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-semibold tracking-tight" title={displayName}>{displayName}</p>
                        {displayEmail ? (
                          <p className="break-all text-sm text-white/70 dark:text-slate-600">{displayEmail}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 text-sm">
                      <ProfileMeta label="Username" value={profile?.username || "Not set"} dark />
                      <ProfileMeta label="Joined" value={formatDate(profile?.created_at)} dark />
                      <ProfileMeta label="Last update" value={formatDateTime(profile?.updated_at)} dark />
                    </div>
                  </article>

                  <div className="grid gap-6">
                    <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Profile</p>
                      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Choose the name shown around the site.</h2>
                      <form className="mt-8 grid gap-5" onSubmit={saveProfile}>
                        <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                          Username
                          <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="project_builder"
                            className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                            required
                          />
                        </label>
                        <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                          Usernames use lowercase letters, numbers, and underscores. This is the name shown in the header and on shared projects.
                        </p>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                          {isPending ? "Saving..." : "Save profile"}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Account email</p>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign-in address</h2>
                      <p className="mt-4 break-all text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {displayEmail || "No email is available for this account yet."}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                        Password recovery emails are sent to this address from the security tab.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              {tab === "appearance" ? (
                <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Appearance</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Switch light, dark, or system theme instantly.</h2>
                  <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    <ThemeCard
                      title="System"
                      description="Follow the browser and operating system preference."
                      active={mode === "system"}
                      icon={<Palette className="h-5 w-5" />}
                      onClick={() => setMode("system")}
                    />
                    <ThemeCard
                      title="Light"
                      description="High contrast, bright surfaces, and crisp document styling."
                      active={mode === "light"}
                      icon={<SunMedium className="h-5 w-5" />}
                      onClick={() => setMode("light")}
                    />
                    <ThemeCard
                      title="Dark"
                      description="Lower glare while keeping the same structure and contrast hierarchy."
                      active={mode === "dark"}
                      icon={<MoonStar className="h-5 w-5" />}
                      onClick={() => setMode("dark")}
                    />
                  </div>
                </div>
              ) : null}
              {tab === "security" ? (
                <div className="grid gap-6">
                  <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Security</p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Recovery and session controls.</h2>
                    <HcaptchaPanel
                      className="mt-8"
                      controllerRef={captchaRef}
                      actionLabel="sending a reset email"
                    />
                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void sendReset()}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        <KeyRound className="h-4 w-4" />
                        Send reset email
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-7 shadow-[0_18px_44px_rgba(244,63,94,0.08)] dark:border-rose-500/30 dark:bg-rose-500/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">Danger zone</p>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-rose-950 dark:text-rose-100">Delete the current account permanently.</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-800 dark:text-rose-200">
                      This removes the current account through the configured backend function. Use it only when you are sure the account should be erased.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isPending}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function OverviewPanel({
  profileName,
  profileEmail,
  profile
}: {
  profileName: string;
  profileEmail: string;
  profile: { email?: string; created_at?: string; updated_at?: string; username?: string } | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Overview</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Current account snapshot.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <MetaCard title="Profile name" value={profileName} caption="Used in the header and shared project attribution." />
          <MetaCard title="Email" value={profileEmail || profile?.email || "Not available"} caption="Primary sign-in and recovery address." />
          <MetaCard title="Created" value={formatDate(profile?.created_at)} caption="When the current profile record was first saved." />
          <MetaCard title="Updated" value={formatDateTime(profile?.updated_at)} caption="Last known profile update timestamp." />
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white dark:text-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Next actions</p>
        <div className="mt-6 grid gap-3">
          <QuickLink href="converter.html" title="Continue in workspace" description="Return to the editor and keep building." dark />
          <QuickLink href="reference.html" title="Scan syntax reference" description="Look up exact commands, examples, and targets." dark />
          <QuickLink href="docs.html" title="Revisit docs" description="Refresh on structure, syntax, and common mistakes." dark />
        </div>
      </div>
    </div>
  );
}

function GuestDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Guest dashboard</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">You do not need an account to use the workspace.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Accounts are optional. Sign in only if you want cloud save, shareable project links, and a persistent identity across sessions. The converter itself remains available without authentication.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="login.html" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
            Log in
          </a>
          <a href="signup.html" className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
            Sign up
          </a>
          <a href="converter.html" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white dark:text-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Why sign in</p>
        <div className="mt-6 grid gap-3">
          <QuickLink href="signup.html" title="Cloud save" description="Keep projects available across devices and sessions." dark />
          <QuickLink href="signup.html" title="Share links" description="Publish projects through the community workflow." dark />
          <QuickLink href="docs.html" title="Learn first" description="Start with the docs if you are still learning the syntax." dark />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-3 break-words text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{caption}</p>
    </article>
  );
}

function ProfileMeta({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${dark ? "border-white/10 bg-white/5 dark:border-slate-950/10 dark:bg-slate-950/5" : "border-black/10 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/55 dark:text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-2 break-words text-sm font-semibold ${dark ? "text-white dark:text-slate-950" : "text-slate-950 dark:text-white"}`}>{value}</p>
    </div>
  );
}

function ThemeCard({
  title,
  description,
  icon,
  active,
  onClick
}: {
  title: string;
  description: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.75rem] border p-6 text-left transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)] dark:border-white dark:bg-white dark:text-slate-950"
          : "border-black/10 bg-slate-50 hover:-translate-y-1 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20"
      }`}
    >
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-white/15 dark:bg-slate-950/10" : "border border-black/10 bg-white dark:border-white/10 dark:bg-white/10"}`}>
        {icon}
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
      <p className={`mt-3 text-sm leading-7 ${active ? "text-white/75 dark:text-slate-700" : "text-slate-600 dark:text-slate-300"}`}>{description}</p>
    </button>
  );
}

function QuickLink({
  href,
  title,
  description,
  dark = false
}: {
  href: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${
        dark
          ? "border-white/15 bg-white/5 hover:bg-white/10 dark:border-slate-300/40 dark:bg-slate-950/5 dark:hover:bg-slate-950/10"
          : "border-black/10 bg-slate-50 hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${dark ? "text-white dark:text-slate-950" : "text-slate-950 dark:text-white"}`}>{title}</p>
          <p className={`mt-1 text-sm leading-6 ${dark ? "text-white/70 dark:text-slate-600" : "text-slate-600 dark:text-slate-300"}`}>{description}</p>
        </div>
        <ArrowRight className={`h-4 w-4 shrink-0 ${dark ? "text-white/70 dark:text-slate-600" : "text-slate-400"}`} />
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 dark:border-white/10 dark:bg-white/5">
      <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="mt-6 h-9 w-72 max-w-full rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="mt-8 grid gap-3">
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-white/10" />
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
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

function readTabFromHash(): DashboardTab {
  const value = window.location.hash.replace("#", "");
  if (value === "profile" || value === "appearance" || value === "security" || value === "overview") {
    return value;
  }
  return "overview";
}
