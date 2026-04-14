import { clientEnv } from "./env";

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  storageKey?: string;
  storage?: Storage | null;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
}

const RATE_LIMIT_PREFIX = "text2scratch.rate-limit";
const inFlightTasks = new Map<string, Promise<unknown>>();

export function consumeRateLimit(scope: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now?.() ?? Date.now();
  const storage = options.storage ?? getSafeStorage();
  const storageKey = options.storageKey || `${RATE_LIMIT_PREFIX}:${scope}`;
  const maxRequests = options.maxRequests ?? clientEnv.apiRateLimitMaxRequests;
  const windowMs = options.windowMs ?? clientEnv.apiRateLimitWindowMs;
  const windowStart = now - windowMs;

  const recentEntries = readEntries(storage, storageKey).filter((timestamp) => timestamp > windowStart);

  if (recentEntries.length >= maxRequests) {
    const earliest = recentEntries[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, earliest + windowMs - now),
      resetAt: earliest + windowMs
    };
  }

  recentEntries.push(now);
  writeEntries(storage, storageKey, recentEntries);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - recentEntries.length),
    retryAfterMs: 0,
    resetAt: now + windowMs
  };
}

export function assertRateLimit(scope: string, options: RateLimitOptions, actionLabel: string) {
  const result = consumeRateLimit(scope, options);
  if (!result.allowed) {
    const retrySeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
    throw new Error(`Too many ${actionLabel} attempts. Wait about ${retrySeconds} seconds and try again.`);
  }
  return result;
}

export async function runRateLimited<T>(
  options: {
    key: string;
    max?: number;
    windowMs?: number;
    message: string;
    dedupeKey?: string;
    dedupeInFlight?: boolean;
  },
  task: () => Promise<T>
) {
  const dedupeKey = options.dedupeKey || options.key;
  if (options.dedupeInFlight !== false) {
    const existingTask = inFlightTasks.get(dedupeKey);
    if (existingTask) {
      return existingTask as Promise<T>;
    }
  }

  const result = consumeRateLimit(options.key, {
    maxRequests: options.max,
    windowMs: options.windowMs
  });

  if (!result.allowed) {
    throw new Error(options.message);
  }

  const nextTask = task().finally(() => {
    inFlightTasks.delete(dedupeKey);
  });

  if (options.dedupeInFlight !== false) {
    inFlightTasks.set(dedupeKey, nextTask);
  }

  return nextTask;
}

function readEntries(storage: Storage | null, storageKey: string) {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
      : [];
  } catch {
    return [];
  }
}

function writeEntries(storage: Storage | null, storageKey: string, entries: number[]) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // Ignore storage failures and fall back to best-effort in-memory behavior.
  }
}

function getSafeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
