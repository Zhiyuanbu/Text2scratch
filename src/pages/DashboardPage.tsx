import type { FormEvent, ReactNode, RefObject } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  HeartHandshake,
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
import {
  clearPendingParentManagedSignup,
  readCoppaAccountMetadata,
  readPendingParentManagedSignup,
  type CoppaAccountMetadata
} from "../lib/coppa";
import { isCaptchaError, type HcaptchaController } from "../lib/hcaptcha";
import { buildAvatarLabel, formatDate, formatDateTime } from "../lib/supabase";
import { useAuth, useTheme, useToast } from "../providers/AppProviders";

type DashboardTab = "overview" | "profile" | "appearance" | "security" | "parent";

const baseTabs: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <ShieldAlert className="h-4 w-4" /> }
];

export function DashboardPage() {
  const { user, profile, isLoading, updateUsername, sendPasswordResetForCurrentUser, createManagedChildAccount, signOut, deleteCurrentAccount } = useAuth();
  const { mode, setMode } = useTheme();
  const { pushToast } = useToast();
  const captchaRef = useRef<HcaptchaController | null>(null);
  const [tab, setTab] = useState<DashboardTab>(() => readTabFromHash());
  const [username, setUsername] = useState("");
  const [pendingChildRequest, setPendingChildRequest] = useState(() => readPendingParentManagedSignup());
  const [childUsername, setChildUsername] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [childConsentAccepted, setChildConsentAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const onHashChange = () => setTab(readTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setUsername(profile?.username || "");
  }, [profile?.username]);

  useEffect(() => {
    if (pendingChildRequest?.requestedUsername && !childUsername.trim()) {
      setChildUsername(pendingChildRequest.requestedUsername);
    }
  }, [childUsername, pendingChildRequest]);

  const displayName = profile?.username || String(user?.user_metadata?.username || "").trim() || user?.email?.split("@")[0] || "Guest";
  const displayEmail = user?.email || profile?.email || "";
  const coppaMetadata = readCoppaAccountMetadata(user);
  const dashboardTabs = coppaMetadata.parentControlsEnabled
    ? [...baseTabs, { id: "parent" as const, label: "Parent controls", icon: <HeartHandshake className="h-4 w-4" /> }]
    : baseTabs;
  const dashboardTitle = coppaMetadata.parentManaged
    ? "Manage a parent-controlled child account."
    : coppaMetadata.accountRole === "parent_guardian"
      ? "Manage your parent account and child requests."
    : "Manage your account settings in one place.";
  const dashboardDescription = coppaMetadata.parentManaged
    ? "Review the approved child username, keep the parent email in control of recovery, and use this dashboard for consent-related account actions."
    : coppaMetadata.accountRole === "parent_guardian"
      ? "Use your own parent account to review child-account requests, create separate child accounts, and manage recovery or deletion actions."
    : "Update your username, switch theme, send reset emails, and jump back into the editor without hopping through separate pages.";

  const selectTab = (nextTab: DashboardTab) => {
    setTab(nextTab);
    if (window.location.hash !== `#${nextTab}`) {
      window.history.replaceState(null, "", `#${nextTab}`);
    }
  };

  useEffect(() => {
    if (!coppaMetadata.parentControlsEnabled && tab === "parent") {
      setTab("overview");
      window.history.replaceState(null, "", "#overview");
    }
  }, [coppaMetadata.parentControlsEnabled, tab]);

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

  const handleCreateChildAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      const captchaToken = requireCaptchaToken(captchaRef.current, "creating a child account");
      const result = await createManagedChildAccount({
        username: childUsername,
        email: childEmail,
        password: childPassword,
        captchaToken,
        parentConsentAccepted: childConsentAccepted
      });

      clearPendingParentManagedSignup();
      setPendingChildRequest(null);
      setChildEmail("");
      setChildPassword("");
      setChildConsentAccepted(false);

      pushToast({
        title: "Child account created",
        description: result.needsEmailVerification
          ? "Check the child-account inbox for the verification email."
          : "The separate child account is ready to use.",
        variant: "success"
      });
    } catch (error) {
      if (isCaptchaError(error)) {
        captchaRef.current?.reset({ clearCache: true });
      }
      pushToast({
        title: "Child account creation failed",
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
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">{dashboardTitle}</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                {dashboardDescription}
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
                {coppaMetadata.parentControlsEnabled ? (
                  <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                    <p className="font-semibold">{coppaMetadata.parentManaged ? "Parent-managed child account" : "Parent account"}</p>
                    <p className="mt-2">
                      {coppaMetadata.parentManaged
                        ? "This account uses the parent email for verification, password reset, and account deletion controls. Open the Parent controls tab to review the consent record and related policies."
                        : "This account is the separate parent or guardian account. Open the Parent controls tab to review any saved child-account request on this device and continue the child-account flow."}
                    </p>
                  </div>
                ) : null}
                <div className="mt-6 grid gap-3">
                  <QuickLink href="converter.html" title="Open workspace" description="Keep working on the current project." />
                  <QuickLink href="reference.html" title="Browse reference" description="Look up exact command syntax." />
                  <QuickLink href={coppaMetadata.parentControlsEnabled ? "privacy.html" : "docs.html"} title={coppaMetadata.parentControlsEnabled ? "Review privacy" : "Read docs"} description={coppaMetadata.parentControlsEnabled ? "Check the child-account privacy and parent-rights summary." : "Review project structure and examples."} />
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
              {dashboardTabs.map((item) => {
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
                <OverviewPanel profileName={displayName} profileEmail={displayEmail} profile={profile} coppaMetadata={coppaMetadata} />
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
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        {coppaMetadata.parentControlsEnabled ? "Parent email" : "Sign-in address"}
                      </h2>
                      <p className="mt-4 break-all text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {displayEmail || "No email is available for this account yet."}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                        {coppaMetadata.parentControlsEnabled
                          ? "Verification and password recovery emails are sent to the parent or guardian address from the security tab."
                          : "Password recovery emails are sent to this address from the security tab."}
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
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {coppaMetadata.parentControlsEnabled ? "Recovery and parent controls." : "Recovery and session controls."}
                    </h2>
                    {coppaMetadata.parentControlsEnabled ? (
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Reset emails go to the parent or guardian address on the account. Use these controls when you need to rotate credentials, verify the child-account setup, or remove a hosted child account.
                      </p>
                    ) : null}
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
                      {coppaMetadata.parentControlsEnabled
                        ? "This removes the current signed-in account through the configured backend function. If you are signed in as the parent account, only the parent account is removed; linked child accounts must be deleted from the child account session."
                        : "This removes the current account through the configured backend function. Use it only when you are sure the account should be erased."}
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
              {tab === "parent" && coppaMetadata.parentControlsEnabled ? (
                <ParentControlsPanel
                  profileName={displayName}
                  profileEmail={displayEmail}
                  coppaMetadata={coppaMetadata}
                  pendingChildRequest={pendingChildRequest}
                  childUsername={childUsername}
                  setChildUsername={setChildUsername}
                  childEmail={childEmail}
                  setChildEmail={setChildEmail}
                  childPassword={childPassword}
                  setChildPassword={setChildPassword}
                  childConsentAccepted={childConsentAccepted}
                  setChildConsentAccepted={setChildConsentAccepted}
                  isPending={isPending}
                  captchaRef={captchaRef}
                  onSubmit={handleCreateChildAccount}
                  onClearPendingRequest={() => {
                    clearPendingParentManagedSignup();
                    setPendingChildRequest(null);
                    setChildUsername("");
                  }}
                />
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
  profile,
  coppaMetadata
}: {
  profileName: string;
  profileEmail: string;
  profile: { email?: string; created_at?: string; updated_at?: string; username?: string } | null;
  coppaMetadata: CoppaAccountMetadata;
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
          {coppaMetadata.parentControlsEnabled ? (
            <MetaCard title="Account type" value={coppaMetadata.parentManaged ? "Parent-managed child account" : "Parent or guardian account"} caption={coppaMetadata.parentManaged ? "Hosted features are controlled through the parent or guardian email on the account." : "This is the separate parent or guardian account used to manage child-account requests."} />
          ) : null}
          {coppaMetadata.parentManaged ? (
            <MetaCard title="Consent record" value={formatDateTime(coppaMetadata.consentAcknowledgedAt)} caption="Timestamp stored when the current parent-managed account flow acknowledged consent." />
          ) : null}
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white dark:text-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Next actions</p>
        <div className="mt-6 grid gap-3">
          <QuickLink href="converter.html" title="Continue in workspace" description="Return to the editor and keep building." dark />
          <QuickLink href="reference.html" title="Scan syntax reference" description="Look up exact commands, examples, and targets." dark />
          <QuickLink
            href={coppaMetadata.parentControlsEnabled ? "dashboard.html#parent" : "docs.html"}
            title={coppaMetadata.parentControlsEnabled ? "Open parent controls" : "Revisit docs"}
            description={coppaMetadata.parentControlsEnabled ? "Review child requests, consent metadata, and linked policy pages." : "Refresh on structure, syntax, and common mistakes."}
            dark
          />
        </div>
      </div>
    </div>
  );
}

function ParentControlsPanel({
  profileName,
  profileEmail,
  coppaMetadata,
  pendingChildRequest,
  childUsername,
  setChildUsername,
  childEmail,
  setChildEmail,
  childPassword,
  setChildPassword,
  childConsentAccepted,
  setChildConsentAccepted,
  isPending,
  captchaRef,
  onSubmit,
  onClearPendingRequest
}: {
  profileName: string;
  profileEmail: string;
  coppaMetadata: CoppaAccountMetadata;
  pendingChildRequest: ReturnType<typeof readPendingParentManagedSignup>;
  childUsername: string;
  setChildUsername: (value: string) => void;
  childEmail: string;
  setChildEmail: (value: string) => void;
  childPassword: string;
  setChildPassword: (value: string) => void;
  childConsentAccepted: boolean;
  setChildConsentAccepted: (value: boolean) => void;
  isPending: boolean;
  captchaRef: RefObject<HcaptchaController | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClearPendingRequest: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-6">
        <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50/90 p-7 shadow-[0_18px_44px_rgba(16,185,129,0.08)] dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Parent controls</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-100">Review the child-account control record.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-900 dark:text-emerald-100">
            This page does not replace formal verifiable parental consent tooling, but it does show how the current parent or child account is marked and which address receives verification, recovery, and deletion actions.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <MetaCard title={coppaMetadata.parentManaged ? "Managed username" : "Parent account username"} value={profileName} caption={coppaMetadata.parentManaged ? "This is the approved child username shown around the site." : "This is the separate parent or guardian account username."} />
            <MetaCard title="Parent email" value={profileEmail || "Not available"} caption="Verification, password reset, and account deletion controls use this address." />
            <MetaCard title="Age-band flag" value={coppaMetadata.accountAgeBand} caption="Value stored in auth metadata for the hosted account flow." />
            <MetaCard title="Consent timestamp" value={formatDateTime(coppaMetadata.consentAcknowledgedAt)} caption={coppaMetadata.parentManaged ? "Recorded when the child account was marked as parent-managed." : "Parent accounts do not store a child-consent timestamp until a child account is created."} />
          </div>
        </article>

        {coppaMetadata.accountRole === "parent_guardian" ? (
          <article className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Create separate child account</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Finish the child-account flow from your own parent account.</h2>
            {pendingChildRequest ? (
              <div className="mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Child request found on this device</p>
                    <p className="mt-2">
                      Requested username <strong>{pendingChildRequest.requestedUsername}</strong>, parent email <strong>{pendingChildRequest.parentEmail}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-1 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">No child request is saved on this device right now.</p>
                    <p className="mt-2">You can still create a child account manually, or start the under-13 request flow from the signup page first.</p>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
              <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Child username
                <input
                  value={childUsername}
                  onChange={(event) => setChildUsername(event.target.value)}
                  placeholder="child_builder"
                  className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Child sign-in email
                <input
                  type="email"
                  value={childEmail}
                  onChange={(event) => setChildEmail(event.target.value)}
                  placeholder="child@example.com"
                  className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Child account password
                <input
                  type="password"
                  value={childPassword}
                  onChange={(event) => setChildPassword(event.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-950 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white dark:focus:bg-white/10"
                  required
                />
              </label>

              <label className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                <input
                  type="checkbox"
                  checked={childConsentAccepted}
                  onChange={(event) => setChildConsentAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I am the parent or guardian, I control the parent account on this device, and I consent to creating this separate child account under the rules described in the <a href="privacy.html" className="font-semibold underline decoration-emerald-400/70 underline-offset-4">privacy policy</a> and <a href="terms.html#terms" className="font-semibold underline decoration-emerald-400/70 underline-offset-4">terms</a>.
                </span>
              </label>

              <HcaptchaPanel
                controllerRef={captchaRef}
                actionLabel="creating a child account"
              />

              <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                Use a child-account email address that the parent or guardian controls. The child account stays separate from the parent account after setup.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {isPending ? "Creating child account..." : "Create child account"}
                </button>
                {pendingChildRequest ? (
                  <button
                    type="button"
                    onClick={onClearPendingRequest}
                    className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-black/20 hover:text-slate-950 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    Clear saved request
                  </button>
                ) : null}
              </div>
            </form>
          </article>
        ) : (
          <article className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Parent actions</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Use the existing controls to manage the account.</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <QuickLink href="dashboard.html#security" title="Open security tab" description="Send a reset email to the parent address or delete the account." />
              <QuickLink href="dashboard.html#profile" title="Open profile tab" description="Review or change the approved username shown in the product." />
              <QuickLink href="privacy.html" title="Read privacy policy" description="Review parent rights, local handoff behavior, and hosted data storage." />
              <QuickLink href="terms.html#terms" title="Read terms" description="Review the child-account and parent-managed account sections." />
            </div>
          </article>
        )}
      </div>

      <aside className="rounded-[2rem] border border-black/10 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white dark:text-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 dark:text-slate-500">Control notes</p>
        <ul className="mt-6 grid gap-3 text-sm leading-7 text-white/80 dark:text-slate-700">
          <li>The parent email remains the recovery and verification address.</li>
          <li>The child username can still be used to sign in after account setup.</li>
          <li>The dashboard delete action removes the hosted account and should be treated as the parent removal control.</li>
        </ul>
      </aside>
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
  if (value === "profile" || value === "appearance" || value === "security" || value === "overview" || value === "parent") {
    return value;
  }
  return "overview";
}
