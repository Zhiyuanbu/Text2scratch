import {
  MODERATION_FALLBACK_QUEUE_TABLE,
  ensureSupabaseConfigured,
  formatSupabaseError,
  supabaseClient
} from "./supabase";

export type ModerationActionType = "restrict_account" | "network_ban";

export interface ModerationAction {
  id: string;
  type: ModerationActionType;
  target: string;
  createdAt: string;
  errorSummary?: string;
}

interface ModerationActionRow {
  id: string;
  action_type: ModerationActionType;
  target: string;
  error_summary: string | null;
  created_at: string;
}

export async function listModerationActions(limitRows = 50) {
  ensureSupabaseConfigured();

  const { data, error } = await supabaseClient
    .from(MODERATION_FALLBACK_QUEUE_TABLE)
    .select("id,action_type,target,error_summary,created_at")
    .order("created_at", { ascending: false })
    .limit(limitRows);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (Array.isArray(data) ? data as ModerationActionRow[] : [])
    .map((value) => normalizeAction({
      id: value.id,
      type: value.action_type,
      target: value.target,
      errorSummary: value.error_summary || "",
      createdAt: value.created_at
    }))
    .filter((value): value is ModerationAction => Boolean(value));
}

export async function enqueueModerationAction(action: ModerationAction) {
  ensureSupabaseConfigured();
  const { data: userData } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient
    .from(MODERATION_FALLBACK_QUEUE_TABLE)
    .upsert({
      id: action.id,
      action_type: action.type,
      target: action.target,
      sql_snippet: buildModerationSql(action),
      error_summary: action.errorSummary || null,
      created_by: userData.user?.id || null,
      created_at: action.createdAt
    });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function deleteModerationAction(actionId: string) {
  ensureSupabaseConfigured();

  const { error } = await supabaseClient
    .from(MODERATION_FALLBACK_QUEUE_TABLE)
    .delete()
    .eq("id", actionId);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export function queueModerationAction(actions: ModerationAction[], type: ModerationActionType, target: string, now = new Date()) {
  const normalizedTarget = String(target || "").trim();
  if (!normalizedTarget) {
    return actions;
  }

  const nextAction: ModerationAction = {
    id: createRecordId(type),
    type,
    target: normalizedTarget,
    createdAt: now.toISOString()
  };

  return [nextAction, ...actions].slice(0, 20);
}

export function removeModerationAction(actions: ModerationAction[], id: string) {
  return actions.filter((action) => action.id !== id);
}

export function buildModerationSql(action: ModerationAction) {
  const escapedTarget = action.target.replace(/'/g, "''");
  if (action.type === "network_ban") {
    return `select public.admin_network_ban('${escapedTarget}');`;
  }

  return `select public.admin_restrict_account('${escapedTarget}');`;
}

function normalizeAction(value: unknown): ModerationAction | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawAction = value as Partial<ModerationAction>;
  const type = rawAction.type === "network_ban" || rawAction.type === "restrict_account"
    ? rawAction.type
    : null;
  const target = String(rawAction.target || "").trim();
  const createdAt = new Date(String(rawAction.createdAt || ""));

  if (!type || !target || Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return {
    id: String(rawAction.id || `${type}-${createdAt.getTime()}`),
    type,
    target,
    errorSummary: String(rawAction.errorSummary || "").trim(),
    createdAt: createdAt.toISOString()
  };
}

function createRecordId(type: ModerationActionType) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${type}-${crypto.randomUUID()}`;
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint32Array(2));
    return `${type}-${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  }

  return `${type}-${Date.now().toString(36)}-fallback`;
}
