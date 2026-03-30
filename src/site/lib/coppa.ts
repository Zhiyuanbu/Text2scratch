export type AuthAudience = "adult" | "teen_13_to_17" | "under_13" | "parent_guardian";
export type SignupAgeBand = "13_or_over" | "under_13_with_parent" | "under_13";
export type AccountRole = "standard" | "parent_guardian";

export interface PendingParentManagedSignup {
  requestedUsername: string;
  parentEmail: string;
  createdAt: string;
}

export interface CoppaAccountMetadata {
  accountAgeBand: SignupAgeBand | "unknown";
  accountRole: AccountRole | "unknown";
  parentManaged: boolean;
  parentControlsEnabled: boolean;
  consentAcknowledgedAt: string;
}

const AUTH_AUDIENCE_KEY = "text2scratch.auth.audience";
const PENDING_PARENT_SIGNUP_KEY = "text2scratch.coppa.pending_parent_signup";

export function readStoredAuthAudience() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_AUDIENCE_KEY);
  return normalizeAuthAudience(stored);
}

export function storeAuthAudience(audience: AuthAudience) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_AUDIENCE_KEY, audience);
}

export function readPendingParentManagedSignup() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(PENDING_PARENT_SIGNUP_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<PendingParentManagedSignup> | null;
    if (
      parsed
      && typeof parsed.requestedUsername === "string"
      && typeof parsed.parentEmail === "string"
      && typeof parsed.createdAt === "string"
    ) {
      return {
        requestedUsername: parsed.requestedUsername,
        parentEmail: parsed.parentEmail,
        createdAt: parsed.createdAt
      };
    }
  } catch {
    // Ignore invalid local state and let the flow recover with a clean form.
  }

  window.localStorage.removeItem(PENDING_PARENT_SIGNUP_KEY);
  return null;
}

export function storePendingParentManagedSignup(input: {
  requestedUsername: string;
  parentEmail: string;
}) {
  if (typeof window === "undefined") {
    return null;
  }

  const nextRecord: PendingParentManagedSignup = {
    requestedUsername: input.requestedUsername,
    parentEmail: input.parentEmail,
    createdAt: new Date().toISOString()
  };

  window.localStorage.setItem(PENDING_PARENT_SIGNUP_KEY, JSON.stringify(nextRecord));
  return nextRecord;
}

export function clearPendingParentManagedSignup() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PENDING_PARENT_SIGNUP_KEY);
}

export function readCoppaAccountMetadata(user: {
  user_metadata?: Record<string, unknown> | null;
} | null | undefined): CoppaAccountMetadata {
  const metadata = user?.user_metadata || {};
  const accountAgeBand = metadata.account_age_band === "13_or_over" || metadata.account_age_band === "under_13_with_parent"
    ? metadata.account_age_band
    : "unknown";
  const accountRole = metadata.account_role === "standard" || metadata.account_role === "parent_guardian"
    ? metadata.account_role
    : "unknown";
  const parentManaged = metadata.parent_managed === true || accountAgeBand === "under_13_with_parent";
  const parentControlsEnabled = metadata.parent_controls_enabled === true || parentManaged || accountRole === "parent_guardian";
  const consentAcknowledgedAt = typeof metadata.coppa_parent_consent_acknowledged_at === "string"
    ? metadata.coppa_parent_consent_acknowledged_at
    : "";

  return {
    accountAgeBand,
    accountRole,
    parentManaged,
    parentControlsEnabled,
    consentAcknowledgedAt
  };
}

function isAuthAudience(value: unknown): value is AuthAudience {
  return value === "adult" || value === "teen_13_to_17" || value === "under_13" || value === "parent_guardian";
}

function normalizeAuthAudience(value: unknown): AuthAudience | null {
  if (value === "13_or_over") {
    return "adult";
  }

  return isAuthAudience(value) ? value : null;
}
