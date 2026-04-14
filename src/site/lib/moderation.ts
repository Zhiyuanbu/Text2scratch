export type ModerationActionType = "restrict_account" | "network_ban";

export interface ModerationAction {
  id: string;
  type: ModerationActionType;
  target: string;
  createdAt: string;
}

const MODERATION_QUEUE_KEY = "text2scratch.admin.moderation-queue.v1";

export function readModerationQueue(storage = resolveStorage()) {
  if (!storage) {
    return [] as ModerationAction[];
  }

  try {
    const rawValue = storage.getItem(MODERATION_QUEUE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => normalizeAction(value))
      .filter((value): value is ModerationAction => Boolean(value));
  } catch {
    return [];
  }
}

export function writeModerationQueue(actions: ModerationAction[], storage = resolveStorage()) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(MODERATION_QUEUE_KEY, JSON.stringify(actions));
  } catch {
    // Ignore storage failures and keep the in-memory state.
  }
}

export function queueModerationAction(actions: ModerationAction[], type: ModerationActionType, target: string, now = new Date()) {
  const normalizedTarget = String(target || "").trim();
  if (!normalizedTarget) {
    return actions;
  }

  const nextAction: ModerationAction = {
    id: `${type}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
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
    createdAt: createdAt.toISOString()
  };
}

function resolveStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
