export type AuthAudience = "adult" | "teen_13_to_17" | "under_13" | "parent_guardian";
export type SignupAgeBand = "13_or_over" | "under_13_with_parent";
export type AccountRole = "standard" | "parent_guardian";

export interface PendingParentManagedSignup {
  requestedUsername: string;
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
  const storage = resolveCoppaStorage();
  if (!storage) {
    return null;
  }

  const stored = storage.getItem(AUTH_AUDIENCE_KEY);
  return normalizeAuthAudience(stored);
}

export function storeAuthAudience(audience: AuthAudience) {
  const storage = resolveCoppaStorage();
  if (!storage) {
    return;
  }

  storage.setItem(AUTH_AUDIENCE_KEY, audience);
}

export function readPendingParentManagedSignup() {
  const storage = resolveCoppaStorage();
  if (!storage) {
    return null;
  }

  const stored = storage.getItem(PENDING_PARENT_SIGNUP_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<PendingParentManagedSignup> | null;
    if (
      parsed
      && typeof parsed.requestedUsername === "string"
      && typeof parsed.createdAt === "string"
    ) {
      return {
        requestedUsername: parsed.requestedUsername,
        createdAt: parsed.createdAt
      };
    }
  } catch {
    // Ignore invalid local state and let the flow recover with a clean form.
  }

  storage.removeItem(PENDING_PARENT_SIGNUP_KEY);
  return null;
}

export function storePendingParentManagedSignup(input: {
  requestedUsername: string;
}) {
  const storage = resolveCoppaStorage();
  if (!storage) {
    return null;
  }

  const nextRecord: PendingParentManagedSignup = {
    requestedUsername: input.requestedUsername,
    createdAt: new Date().toISOString()
  };

  storage.setItem(PENDING_PARENT_SIGNUP_KEY, JSON.stringify(nextRecord));
  return nextRecord;
}

export function clearPendingParentManagedSignup() {
  const storage = resolveCoppaStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(PENDING_PARENT_SIGNUP_KEY);
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

export function calculateAgeFromBirthdate(year: number, month: number, day: number, today = new Date()) {
  const birthDate = new Date(year, month - 1, day);
  if (
    Number.isNaN(birthDate.getTime())
    || birthDate.getFullYear() !== year
    || birthDate.getMonth() !== month - 1
    || birthDate.getDate() !== day
  ) {
    throw new Error("Enter a valid birthdate.");
  }

  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear = (
    today.getMonth() > month - 1
    || (today.getMonth() === month - 1 && today.getDate() >= day)
  );

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
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

function resolveCoppaStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
