import type { FormEvent, ReactNode } from "react";
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
  UserRound,
  ShieldCheck,
  Settings,
  Database,
  Trash2,
  Ban,
  Fingerprint,
  Info,
  Terminal
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { showConfirmDialog } from "../../legacy/shared/dialog-client.js";
import { AppShell } from "../components/AppShell";
import { TurnstilePanel } from "../components/TurnstilePanel";
import {
  clearPendingParentManagedSignup,
  readCoppaAccountMetadata,
  readPendingParentManagedSignup,
  type CoppaAccountMetadata
} from "../lib/coppa";
import { type TurnstileController } from "../lib/turnstile";
import { buildAvatarLabel, formatDate, formatDateTime } from "../lib/supabase";
import { useAuth, useTheme, useToast } from "../providers/AppProviders";

type DashboardTab = "overview" | "profile" | "appearance" | "security" | "parent" | "admin";

const baseTabs: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "profile", label: "Profile", icon: <UserRound size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "security", label: "Security", icon: <ShieldAlert size={16} /> }
];

export function DashboardPage() {
  const { user, profile, isLoading, isAdmin, updateUsername, sendPasswordResetForCurrentUser, createManagedChildAccount, signOut, deleteCurrentAccount } = useAuth();
  const { mode, setMode, resolvedMode } = useTheme();
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

  const coppaMetadata = readCoppaAccountMetadata(user);
  let dashboardTabs = [...baseTabs];
  if (coppaMetadata.parentControlsEnabled) {
    dashboardTabs.push({ id: "parent", label: "Parent", icon: <HeartHandshake size={16} /> });
  }
  if (isAdmin) {
    dashboardTabs.push({ id: "admin", label: "Admin Protocol", icon: <Terminal size={16} /> });
  }

  const selectTab = (nextTab: DashboardTab) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `#${nextTab}`);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    try {
      await updateUsername(username);
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

              <nav className="space-y-1">
                {dashboardTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTab(t.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      tab === t.id 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-[#161b22]"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
                <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
                <button
                  onClick={() => void signOut()}
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
                    {dashboardTabs.find(t => t.id === tab)?.icon}
                    {dashboardTabs.find(t => t.id === tab)?.label}
                  </h2>
                </div>

                <div className="p-6">
                  {tab === "overview" && <OverviewTab user={user} profile={profile} coppa={coppaMetadata} />}
                  {tab === "profile" && (
                    <form onSubmit={saveProfile} className="max-w-md space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Node Identifier</label>
                        <input
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <button disabled={isPending} type="submit" className="rounded-md bg-[#2da44e] px-4 py-2 text-sm font-bold text-white hover:bg-[#2c974b] shadow-sm transition-colors">
                        Commit Changes
                      </button>
                    </form>
                  )}
                  {tab === "appearance" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ThemeOption label="Light" active={mode === "light"} onClick={() => setMode("light")} icon={<SunMedium size={20} />} />
                      <ThemeOption label="Dark" active={mode === "dark"} onClick={() => setMode("dark")} icon={<MoonStar size={20} />} />
                      <ThemeOption label="System" active={mode === "system"} onClick={() => setMode("system")} icon={<Palette size={20} />} />
                    </div>
                  )}
                  {tab === "security" && (
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
                  {tab === "admin" && isAdmin && <AdminProtocolTab />}
                </div>
              </div>
            </main>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OverviewTab({ user, profile, coppa }: { user: any, profile: any, coppa: CoppaAccountMetadata }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard label="Account Registered" value={formatDate(profile?.created_at)} />
      <StatCard label="Protocol Address" value={user?.email || "Encrypted"} />
      <StatCard label="Clearance Level" value={coppa.parentManaged ? "Parent Managed" : "Full Core Access"} />
      <StatCard label="Session Status" value="Active / Authorized" />
    </div>
  );
}

function AdminProtocolTab() {
  const { pushToast } = useToast();
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <AdminActionCard icon={<Trash2 />} title="Purge Project" description="Remove any project by ID" onClick={() => pushToast({title: "Admin Action", description: "Not implemented in current schema."})} />
        <AdminActionCard icon={<Ban />} title="Restrict Account" description="Revoke access permissions" onClick={() => pushToast({title: "Admin Action", description: "Not implemented in current schema."})} />
        <AdminActionCard icon={<ShieldAlert />} title="Network Ban" description="Execute IP-level restriction" onClick={() => pushToast({title: "Admin Action", description: "Not implemented in current schema."})} />
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0d1117]">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Database size={12} /> System Logs
        </h3>
        <div className="font-mono text-[0.7rem] text-slate-500 space-y-1">
          <p>[2026-03-28 14:22] - Node initialization successful.</p>
          <p>[2026-03-28 14:25] - Admin Clearance Verified.</p>
          <p>[2026-03-28 14:30] - Ready for system instructions...</p>
        </div>
      </div>
    </div>
  );
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
