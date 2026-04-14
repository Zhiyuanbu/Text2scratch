import type { FormEvent, ReactNode } from "react";
import {
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Palette,
  ShieldAlert,
  SunMedium,
  UserRound,
  Database,
  Trash2,
  Ban,
  Info,
  Terminal,
  Search
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { showConfirmDialog, showPromptDialog } from "../../legacy/shared/dialog-client.js";
import { AppShell } from "../components/AppShell";
import { TurnstilePanel } from "../components/TurnstilePanel";
import {
  clearPendingParentManagedSignup,
  readCoppaAccountMetadata,
  readPendingParentManagedSignup,
  type CoppaAccountMetadata,
  type PendingParentManagedSignup
} from "../lib/coppa";
import { createErrorReport } from "../lib/errorReports";
import { sanitizeEmailInput, sanitizeSingleLineInput } from "../lib/inputSafety";
import {
  buildModerationSql,
  queueModerationAction,
  readModerationQueue,
  removeModerationAction,
  writeModerationQueue,
  type ModerationAction
} from "../lib/moderation";
import { type TurnstileController } from "../lib/turnstile";
import {
  buildAvatarLabel,
  formatDate,
  formatDateTime,
  formatSupabaseError,
  type ProfileRecord,
  type User,
  supabaseClient,
  CLOUD_TABLE
} from "../lib/supabase";
import { useAuth, useTheme, useToast } from "../providers/AppProviders";

type DashboardTab = "overview" | "profile" | "appearance" | "security" | "parent" | "admin";

interface RegistryProject {
  id: string;
  title: string | null;
  owner_username: string | null;
  is_public: boolean;
  updated_at: string | null;
}

const baseTabs: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "profile", label: "Profile", icon: <UserRound size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "security", label: "Security", icon: <ShieldAlert size={16} /> }
];

export function DashboardPage() {
  const { user, profile, isLoading, isAdmin, updateUsername, sendPasswordResetForCurrentUser, signOut, deleteCurrentAccount } = useAuth();
  const { mode, setMode } = useTheme();
  const { pushToast } = useToast();
  const turnstileRef = useRef<TurnstileController | null>(null);
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

  useEffect(() => { setUsername(profile?.username || ""); }, [profile?.username]);
  useEffect(() => {
    if (!pendingChildRequest) {
      return;
    }

    setChildUsername(pendingChildRequest.requestedUsername || "");
    setChildEmail("");
  }, [pendingChildRequest]);

  const coppaMetadata = readCoppaAccountMetadata(user);
  const dashboardTabs = [
    ...baseTabs,
    ...(coppaMetadata.parentControlsEnabled ? [{ id: "parent" as const, label: "Parent", icon: <HeartHandshake size={16} /> }] : []),
    ...(isAdmin ? [{ id: "admin" as const, label: "Admin Protocol", icon: <Terminal size={16} /> }] : [])
  ];
  const hasRequestedTab = dashboardTabs.some((entry) => entry.id === tab);
  const activeTab = hasRequestedTab ? tab : "overview";
  const activeTabInfo = dashboardTabs.find((entry) => entry.id === activeTab);

  const selectTab = (nextTab: DashboardTab) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `#${nextTab}`);
  };

  useEffect(() => {
    if (hasRequestedTab) {
      return;
    }

    setTab("overview");
    window.history.replaceState(null, "", "#overview");
  }, [hasRequestedTab, tab, coppaMetadata.parentControlsEnabled, isAdmin]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    try {
      await updateUsername(sanitizeSingleLineInput(username, 32));
      pushToast({ title: "Profile updated", variant: "success" });
    } catch (error) {
      pushToast({ title: "Update failed", description: String(error), variant: "error" });
    } finally { setIsPending(false); }
  };

  const sendReset = async () => {
    setIsPending(true);
    try {
      const token = turnstileRef.current?.getToken();
      await sendPasswordResetForCurrentUser(token);
      pushToast({ title: "Reset email sent", variant: "success" });
    } catch (error) {
      pushToast({ title: "Reset failed", description: String(error), variant: "error" });
    } finally { setIsPending(false); }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      title: "Delete account?",
      message: "This is irreversible. Data will be purged.",
      confirmLabel: "Delete permanently",
      tone: "danger"
    });
    if (!confirmed) return;
    setIsPending(true);
    try {
      await deleteCurrentAccount();
      window.location.assign("index.html");
    } catch (error) {
      pushToast({ title: "Error", description: String(error), variant: "error" });
      setIsPending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.assign("index.html?signed_out=1");
    } catch (error) {
      const report = createErrorReport(error, { area: "dashboard sign out" });
      pushToast({ title: "Sign-out failed", description: report.summary, variant: "error" });
    }
  };

  if (!user && !isLoading) {
    return (
      <AppShell page="dashboard">
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <Info size={40} className="text-slate-300 mb-4" />
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-sm text-slate-500 mt-2">Authorization required to view dashboard nodes.</p>
          <a href="login.html" className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Sign in</a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell page="dashboard">
      <div className="flex h-full flex-col bg-[#f6f8fa] dark:bg-[#0d1117] animate-in fade-in duration-500">
        <div className="flex-1 overflow-hidden p-4">
          <div className="mx-auto flex h-full max-w-6xl gap-6">
            
            {/* Navigation Sidebar */}
            <aside className="w-64 shrink-0 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#4d97ff] text-white font-bold text-lg">
                    {buildAvatarLabel(profile?.username || user?.email || "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{profile?.username || "Authorized User"}</p>
                    <p className="truncate text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">
                      {isAdmin ? "Admin Root" : "Standard Node"}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-1" aria-label="Dashboard sections">
                <div role="tablist" aria-orientation="vertical" className="space-y-1">
                {dashboardTabs.map((t) => (
                  <button
                    key={t.id}
                    id={`dashboard-tab-${t.id}`}
                    onClick={() => selectTab(t.id)}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.id}
                    aria-controls={`dashboard-panel-${t.id}`}
                    tabIndex={activeTab === t.id ? 0 : -1}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      activeTab === t.id 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-[#161b22]"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
                </div>
                <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto min-w-0">
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
                <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {activeTabInfo?.icon}
                    {activeTabInfo?.label}
                  </h2>
                </div>

                <section
                  id={`dashboard-panel-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`dashboard-tab-${activeTab}`}
                  tabIndex={0}
                  className="p-6 outline-none"
                >
                  {activeTab === "overview" && <OverviewTab user={user} profile={profile} coppa={coppaMetadata} />}
                  {activeTab === "profile" && (
                    <form onSubmit={saveProfile} className="max-w-md space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="dashboard-username" className="text-xs font-bold uppercase tracking-widest text-slate-400">Node Identifier</label>
                        <input
                          id="dashboard-username"
                          value={username}
                          onChange={e => setUsername(sanitizeSingleLineInput(e.target.value, 32))}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <button disabled={isPending} type="submit" className="rounded-md bg-[#2da44e] px-4 py-2 text-sm font-bold text-white hover:bg-[#2c974b] shadow-sm transition-colors">
                        Commit Changes
                      </button>
                    </form>
                  )}
                  {activeTab === "appearance" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ThemeOption label="Light" active={mode === "light"} onClick={() => setMode("light")} icon={<SunMedium size={20} />} />
                      <ThemeOption label="Dark" active={mode === "dark"} onClick={() => setMode("dark")} icon={<MoonStar size={20} />} />
                      <ThemeOption label="System" active={mode === "system"} onClick={() => setMode("system")} icon={<Palette size={20} />} />
                    </div>
                  )}
                  {activeTab === "security" && (
                    <div className="space-y-8">
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><KeyRound size={16} className="text-blue-600" /> Rotate Security Keys</h3>
                        <TurnstilePanel controllerRef={turnstileRef} actionLabel="reset" className="mb-4" />
                        <button onClick={sendReset} disabled={isPending} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22]">
                          Dispatch Recovery Email
                        </button>
                      </div>
                      <div className="rounded-md border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/20 dark:bg-transparent">
                        <h3 className="text-sm font-bold text-rose-600 mb-2 flex items-center gap-2"><Trash2 size={16} /> Danger Zone</h3>
                        <p className="text-xs text-rose-800 dark:text-rose-400 mb-4 font-medium">Decommission this node and purge all associated project data.</p>
                        <button onClick={handleDelete} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 shadow-sm">
                          Execute Account Deletion
                        </button>
                      </div>
                    </div>
                  )}
                  {activeTab === "parent" && coppaMetadata.parentControlsEnabled && (
                    <ParentTab
                      pendingChildRequest={pendingChildRequest}
                      childUsername={childUsername}
                      childEmail={childEmail}
                      childPassword={childPassword}
                      childConsentAccepted={childConsentAccepted}
                      isPending={isPending}
                      onChildUsernameChange={setChildUsername}
                      onChildEmailChange={setChildEmail}
                      onChildPasswordChange={setChildPassword}
                      onChildConsentChange={setChildConsentAccepted}
                      onRequestCleared={() => setPendingChildRequest(null)}
                      onDone={() => {
                        setChildUsername("");
                        setChildEmail("");
                        setChildPassword("");
                        setChildConsentAccepted(false);
                      }}
                    />
                  )}
                  {activeTab === "admin" && isAdmin && <AdminProtocolTab />}
                </section>
              </div>
            </main>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OverviewTab({ user, profile, coppa }: { user: User | null; profile: ProfileRecord | null; coppa: CoppaAccountMetadata }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard label="Account Registered" value={formatDate(profile?.created_at)} />
      <StatCard label="Protocol Address" value={user?.email || "Encrypted"} />
      <StatCard label="Clearance Level" value={coppa.parentManaged ? "Parent Managed" : "Full Core Access"} />
      <StatCard label="Session Status" value="Active / Authorized" />
    </div>
  );
}

function ParentTab({
  pendingChildRequest,
  childUsername,
  childEmail,
  childPassword,
  childConsentAccepted,
  isPending,
  onChildUsernameChange,
  onChildEmailChange,
  onChildPasswordChange,
  onChildConsentChange,
  onRequestCleared,
  onDone
}: {
  pendingChildRequest: PendingParentManagedSignup | null;
  childUsername: string;
  childEmail: string;
  childPassword: string;
  childConsentAccepted: boolean;
  isPending: boolean;
  onChildUsernameChange: (value: string) => void;
  onChildEmailChange: (value: string) => void;
  onChildPasswordChange: (value: string) => void;
  onChildConsentChange: (value: boolean) => void;
  onRequestCleared: () => void;
  onDone: () => void;
}) {
  const { createManagedChildAccount } = useAuth();
  const { pushToast } = useToast();
  const turnstileRef = useRef<TurnstileController | null>(null);

  const handleCreateChildAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextUsername = sanitizeSingleLineInput(childUsername, 32) || sanitizeSingleLineInput(pendingChildRequest?.requestedUsername || "", 32);
    const nextEmail = sanitizeEmailInput(childEmail);

    if (!nextUsername) {
      pushToast({ title: "Missing username", description: "Enter the child's account name.", variant: "warning" });
      return;
    }

    if (!nextEmail) {
      pushToast({ title: "Missing email", description: "Enter the child's email address.", variant: "warning" });
      return;
    }

    if (!childPassword || childPassword.length < 6) {
      pushToast({ title: "Weak password", description: "Use at least 6 characters for the child account.", variant: "warning" });
      return;
    }

    if (!childConsentAccepted) {
      pushToast({ title: "Consent required", description: "Confirm that the parent or guardian approved this account.", variant: "warning" });
      return;
    }

    const captchaToken = turnstileRef.current?.getToken();
    try {
      await createManagedChildAccount({
        username: nextUsername,
        email: nextEmail,
        password: childPassword,
        captchaToken,
        parentConsentAccepted: true
      });
      clearPendingParentManagedSignup();
      onRequestCleared();
      onDone();
      turnstileRef.current?.reset({ clearCache: true });
      pushToast({ title: "Child account created", description: "The managed account is ready.", variant: "success" });
    } catch (error) {
      pushToast({ title: "Creation failed", description: String(error), variant: "error" });
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-[#0d1117]">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <HeartHandshake size={16} />
            <h3 className="text-sm font-black uppercase tracking-widest">Parent Controls</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Complete the child handoff, create a managed account, and keep the request attached to this dashboard until you clear it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Pending Request" value={pendingChildRequest ? "Queued" : "None"} />
            <StatCard label="Managed Mode" value="Enabled" />
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22]">
          <h4 className="text-[0.7rem] font-black uppercase tracking-widest text-slate-400">Request Summary</h4>
          {pendingChildRequest ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Requested Username</p>
                <p className="mt-1 font-bold">{pendingChildRequest.requestedUsername}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Parent Email</p>
                <p className="mt-1 font-bold break-all">{pendingChildRequest.parentEmail}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-slate-400">Captured At</p>
                <p className="mt-1 font-bold">{formatDateTime(pendingChildRequest.createdAt)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              No pending child request is stored locally. You can still create a managed account manually below.
            </p>
          )}
        </section>
      </div>

      <form onSubmit={handleCreateChildAccount} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black tracking-tight">Create Managed Child Account</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use the stored request as a handoff, then provide the child's email and password to finish setup.
            </p>
          </div>
          <div className="hidden rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-slate-400 sm:block dark:border-slate-800">
            Managed Flow
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Child Username</label>
            <input
              value={childUsername}
              onChange={(e) => onChildUsernameChange(sanitizeSingleLineInput(e.target.value, 32))}
              placeholder={pendingChildRequest?.requestedUsername || "child_user"}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Child Email</label>
            <input
              type="email"
              value={childEmail}
              onChange={(e) => onChildEmailChange(sanitizeEmailInput(e.target.value))}
              placeholder="child@example.com"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Child Password</label>
          <input
            type="password"
            value={childPassword}
            onChange={(e) => onChildPasswordChange(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <input
            type="checkbox"
            checked={childConsentAccepted}
            onChange={(e) => onChildConsentChange(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I confirm a parent or guardian approved this managed account and I am authorized to create it.
          </span>
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <TurnstilePanel controllerRef={turnstileRef} actionLabel="create the child account" />
          <div className="flex flex-col gap-2 lg:pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#2da44e] px-4 py-2 text-sm font-bold text-white hover:bg-[#2c974b] shadow-sm transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Managed Account"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearPendingParentManagedSignup();
                onRequestCleared();
                pushToast({ title: "Pending request cleared", variant: "success" });
              }}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0d1117] dark:hover:bg-slate-900"
            >
              Clear Stored Request
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AdminProtocolTab() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [adminQuery, setAdminQuery] = useState("");
  const [adminProjects, setAdminProjects] = useState<RegistryProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [registryMode, setRegistryMode] = useState<"global" | "limited" | "unavailable">("global");
  const [registryNotice, setRegistryNotice] = useState("Live registry access is available.");
  const [lastRegistrySync, setLastRegistrySync] = useState("");
  const [moderationQueue, setModerationQueue] = useState<ModerationAction[]>(() => readModerationQueue());

  const loadAllProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const rpcResult = await runRegistryRequest<RegistryProject[]>((signal) =>
        supabaseClient
          .rpc("admin_list_projects", { max_rows: 100 })
          .abortSignal(signal)
      );
      if (!rpcResult.error) {
        setAdminProjects(Array.isArray(rpcResult.data) ? rpcResult.data : []);
        setRegistryMode("global");
        setRegistryNotice("Full registry loaded from the admin RPC.");
        setLastRegistrySync(new Date().toISOString());
        return;
      }

      const directResult = await runRegistryRequest<RegistryProject[]>((signal) =>
        supabaseClient
          .from(CLOUD_TABLE)
          .select("id,title,owner_username,is_public,updated_at")
          .order("updated_at", { ascending: false })
          .limit(100)
          .abortSignal(signal)
      );
      if (!directResult.error) {
        setAdminProjects(Array.isArray(directResult.data) ? directResult.data : []);
        setRegistryMode("global");
        setRegistryNotice("Full registry loaded from the projects table.");
        setLastRegistrySync(new Date().toISOString());
        return;
      }

      const primaryMessage = formatRegistryError(rpcResult.error);
      const directMessage = formatRegistryError(directResult.error);
      const combinedMessage = [primaryMessage, directMessage].filter(Boolean).join(" ");

      if (canFallbackToPublicRegistry(combinedMessage)) {
        const publicResult = await runRegistryRequest<RegistryProject[]>((signal) =>
          supabaseClient
            .from(CLOUD_TABLE)
            .select("id,title,owner_username,is_public,updated_at")
            .eq("is_public", true)
            .order("updated_at", { ascending: false })
            .limit(100)
            .abortSignal(signal)
        );

        if (!publicResult.error) {
          setAdminProjects(Array.isArray(publicResult.data) ? publicResult.data : []);
          setRegistryMode("limited");
          setRegistryNotice("Browser access cannot read the full registry. Showing public projects only until the admin RPC from supabase/schema.sql is installed.");
          setLastRegistrySync(new Date().toISOString());
          pushToast({
            title: "Registry limited",
            description: "Loaded the public registry fallback because full admin access is blocked in the browser.",
            variant: "warning"
          });
          return;
        }
      }

      setAdminProjects([]);
      setRegistryMode("unavailable");
      setRegistryNotice(directMessage || primaryMessage || "Registry sync failed.");
      pushToast({
        title: "Registry Sync Failed",
        description: directMessage || primaryMessage || "Registry sync failed.",
        variant: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);

  const handlePurge = async (projectId: string) => {
    const ok = await showConfirmDialog({
      title: "Purge Node?",
      message: "This will permanently delete this project from the global registry.",
      confirmLabel: "Purge project",
      cancelLabel: "Cancel",
      tone: "danger"
    });
    if (!ok) return;

    try {
      const { error } = await supabaseClient.from(CLOUD_TABLE).delete().eq("id", projectId);
      if (error) throw error;
      pushToast({ title: "Node Purged", variant: "success" });
      void loadAllProjects();
    } catch (error) {
      pushToast({ title: "Purge Failed", description: formatSupabaseError(error), variant: "error" });
    }
  };

  const persistModerationQueue = (nextQueue: ModerationAction[]) => {
    setModerationQueue(nextQueue);
    writeModerationQueue(nextQueue);
  };

  const queueFallbackModerationAction = async (
    type: "restrict_account" | "network_ban",
    target: string,
    reason: unknown
  ) => {
    const nextQueue = queueModerationAction(moderationQueue, type, target);
    persistModerationQueue(nextQueue);
    const queuedAction = nextQueue[0];
    const sqlSnippet = queuedAction ? buildModerationSql(queuedAction) : "";
    const report = createErrorReport(reason, { area: type === "network_ban" ? "network ban" : "account restriction" });

    if (sqlSnippet) {
      try {
        await navigator.clipboard.writeText(sqlSnippet);
      } catch {
        // Clipboard can fail in some browsers; the queue panel still exposes the SQL.
      }
    }

    pushToast({
      title: "Action queued locally",
      description: `${report.summary} The SQL fallback${sqlSnippet ? " was copied to your clipboard" : " is listed below"} for manual execution.`,
      variant: "warning"
    });
  };

  const handleRestrictAccount = async () => {
    const identifier = await showPromptDialog({
      title: "Restrict Account",
      message: "Enter username or email to revoke access permissions.",
      inputLabel: "Username or email",
      placeholder: "user_identifier"
    });
    if (!identifier) return;
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) return;

    try {
      const { error } = await supabaseClient.rpc("admin_restrict_account", { identifier: normalizedIdentifier });
      if (error) {
        if (error.message?.includes("function") && error.message?.includes("does not exist")) {
          throw new Error("Admin RPC 'admin_restrict_account' is not installed in Supabase.");
        }
        throw error;
      }
      pushToast({ title: "Account Restricted", description: `Permissions revoked for ${normalizedIdentifier}`, variant: "success" });
    } catch (error) {
      if (normalizedIdentifier && !normalizedIdentifier.includes("@")) {
        const { error: visibilityError } = await supabaseClient
          .from(CLOUD_TABLE)
          .update({ is_public: false, share_slug: null, updated_at: new Date().toISOString() })
          .eq("owner_username", normalizedIdentifier)
          .eq("is_public", true);

        if (!visibilityError) {
          pushToast({
            title: "Projects hidden",
            description: `Public projects for ${normalizedIdentifier} were hidden even though the full ban RPC is unavailable.`,
            variant: "warning"
          });
          void loadAllProjects();
          return;
        }
      }

      await queueFallbackModerationAction("restrict_account", normalizedIdentifier, error);
    }
  };

  const handleNetworkBan = async () => {
    const ip = await showPromptDialog({
      title: "Network Ban",
      message: "Enter IP address or CIDR range to restrict access.",
      inputLabel: "IP or CIDR",
      placeholder: "127.0.0.1"
    });
    if (!ip) return;
    const normalizedIp = ip.trim();
    if (!normalizedIp) return;

    try {
      const { error } = await supabaseClient.rpc("admin_network_ban", { ip_address: normalizedIp });
      if (error) {
        if (error.message?.includes("function") && error.message?.includes("does not exist")) {
          throw new Error("Admin RPC 'admin_network_ban' is not installed in Supabase.");
        }
        throw error;
      }
      pushToast({ title: "Network Ban Applied", description: `IP ${normalizedIp} has been restricted.`, variant: "success" });
    } catch (error) {
      await queueFallbackModerationAction("network_ban", normalizedIp, error);
    }
  };

  const handleCopyModerationSql = async (action: ModerationAction) => {
    const sqlSnippet = buildModerationSql(action);

    try {
      await navigator.clipboard.writeText(sqlSnippet);
      pushToast({ title: "SQL copied", description: "The fallback moderation statement is on your clipboard.", variant: "success" });
    } catch {
      pushToast({ title: "Copy failed", description: "Clipboard access was blocked. Copy the SQL directly from the queue panel.", variant: "warning" });
    }
  };

  const handleRemoveQueuedAction = (actionId: string) => {
    persistModerationQueue(removeModerationAction(moderationQueue, actionId));
  };

  useEffect(() => {
    void loadAllProjects();
  }, [loadAllProjects]);

  const filtered = adminProjects.filter(p => 
    String(p.title || "").toLowerCase().includes(adminQuery.toLowerCase()) ||
    String(p.owner_username || "").toLowerCase().includes(adminQuery.toLowerCase()) ||
    String(p.id).toLowerCase().includes(adminQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <AdminActionCard icon={<Trash2 />} title="Purge Project" description="Remove any project by ID" onClick={() => pushToast({title: "Admin Action", description: "Use the project list below to purge."})} />
        <AdminActionCard icon={<Ban />} title="Restrict Account" description="Revoke access or hide public projects" onClick={handleRestrictAccount} />
        <AdminActionCard icon={<ShieldAlert />} title="Network Ban" description="Execute IP-level restriction or queue SQL fallback" onClick={handleNetworkBan} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2"><Database size={16} /> Global Project Registry</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAllProjects()}
              disabled={isLoading}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Retry
            </button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                value={adminQuery}
                onChange={e => setAdminQuery(e.target.value)}
                placeholder="Search all nodes..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-8 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>

        <div className={`rounded-md border px-4 py-3 text-sm ${
          registryMode === "global"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-100"
            : registryMode === "limited"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-100"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-100"
        }`}>
          <p className="font-semibold">{registryNotice}</p>
          <p className="mt-1 text-xs font-medium opacity-80">
            {lastRegistrySync ? `Last sync: ${formatDateTime(lastRegistrySync)}` : "No successful registry sync yet."}
            {user?.id ? " Browser sessions can only see data allowed by Supabase policies." : ""}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 overflow-hidden dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2">Node ID</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Querying registry...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No nodes found matching filter.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id || Math.random().toString()} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono text-[0.65rem]">{String(p.id || "").slice(0, 8)}...</td>
                    <td className="px-4 py-2 font-bold">{p.title || "Untitled"}</td>
                    <td className="px-4 py-2">{p.owner_username || "anonymous"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold ${p.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.is_public ? 'PUBLIC' : 'PRIVATE'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-rose-600 hover:text-rose-700 font-bold" onClick={() => handlePurge(p.id)}>PURGE</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Moderation fallback queue</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              When a moderation RPC is missing, the action is stored here with a copyable SQL fallback.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {moderationQueue.length} queued
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {moderationQueue.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No queued moderation actions. Browser-only fallback will place missing ban and restriction actions here.
            </div>
          ) : (
            moderationQueue.map((action) => (
              <div key={action.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {action.type === "network_ban" ? "Network Ban" : "Restrict Account"}
                    </p>
                    <p className="mt-1 font-mono text-sm">{action.target}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDateTime(action.createdAt)}</p>
                </div>
                <pre className="overflow-x-auto rounded-md border border-slate-200 bg-white px-3 py-2 text-[0.7rem] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {buildModerationSql(action)}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyModerationSql(action)}
                    className="rounded-md bg-[#4d97ff] px-3 py-1.5 text-[0.7rem] font-black uppercase text-white hover:bg-blue-600"
                  >
                    Copy SQL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveQueuedAction(action.id)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[0.7rem] font-black uppercase hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Database size={12} /> System Logs
        </h3>
        <div className="font-mono text-[0.7rem] text-slate-500 space-y-1">
          <p>[2026-03-28 14:22] - Node initialization successful.</p>
          <p>[2026-03-28 14:25] - Admin Clearance Verified.</p>
          <p>[2026-03-28 14:30] - Registry mode: {registryMode.toUpperCase()}.</p>
          <p>[2026-03-30 09:15] - Moderation fallback queue enabled.</p>
          <p>[{new Date().toISOString().replace('T', ' ').slice(0, 19)}] - Admin Protocol session initialized.</p>
        </div>
      </div>
    </div>
  );
}

function canFallbackToPublicRegistry(message: string) {
  return /row-level security|permission denied|rls|timed out|failed to fetch|network/i.test(message);
}

function formatRegistryError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "Request timed out (10s). Registry sync failed.";
  }

  return formatSupabaseError(error);
}

async function runRegistryRequest<T>(buildRequest: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: unknown }>) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const result = await buildRequest(controller.signal);
    window.clearTimeout(timeoutId);
    return result;
  } catch (error) {
    window.clearTimeout(timeoutId);
    return { data: null, error };
  }
}

function AdminActionCard({ icon, title, description, onClick }: { icon: ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center p-6 rounded-lg border border-slate-200 hover:border-blue-400 transition-all dark:border-slate-800 dark:hover:bg-slate-800/50">
      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-4 dark:bg-slate-800 dark:text-slate-400">
        {icon}
      </div>
      <h4 className="text-sm font-bold mb-1">{title}</h4>
      <p className="text-[0.7rem] text-slate-500 text-center">{description}</p>
    </button>
  );
}

function ThemeOption({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: ReactNode }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-4 rounded-lg border transition-all ${active ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"}`}>
      <div className={`${active ? "text-blue-600" : "text-slate-400"} mb-3`}>{icon}</div>
      <span className={`text-xs font-bold ${active ? "text-blue-600" : "text-slate-600 dark:text-slate-400"}`}>{label}</span>
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black tracking-tight">{value}</p>
    </div>
  );
}

function readTabFromHash(): DashboardTab {
  const h = window.location.hash.replace("#", "");
  return ["overview", "profile", "appearance", "security", "parent", "admin"].includes(h) ? h as DashboardTab : "overview";
}
