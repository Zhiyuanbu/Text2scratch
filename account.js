import {
  buildAvatarText,
  copyText,
  createSupabaseClient,
  formatDate,
  formatDateTime,
  formatSupabaseError,
  getProfileRecord,
  getSessionUser,
  getUserDisplayName,
  getUserEmail,
  sendPasswordResetForCurrentUser
} from "./account-shared.js";

const ui = {
  guestView: document.getElementById("accountGuestView"),
  userView: document.getElementById("accountUserView"),
  userAvatar: document.getElementById("accountUserAvatar"),
  userDisplayName: document.getElementById("accountUserDisplayName"),
  userEmail: document.getElementById("accountUserEmail"),
  username: document.getElementById("accountUsername"),
  userSince: document.getElementById("accountUserSince"),
  userUpdatedAt: document.getElementById("accountUserUpdatedAt"),
  copyUserId: document.getElementById("accountCopyUserIdBtn"),
  sendReset: document.getElementById("accountSendResetBtn"),
  signOut: document.getElementById("accountSignOutBtn"),
  deleteAccount: document.getElementById("accountDeleteBtn"),
  status: document.getElementById("accountStatus")
};

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

init().catch((error) => {
  setStatus(`Startup error: ${formatSupabaseError(error)}`, "error");
});

async function init() {
  if (!ui.status) {
    return;
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    setActionsEnabled(false);
    return;
  }

  bindEvents();
  await refreshAccountState();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    currentProfile = await loadProfileSafely(currentUser);
    renderAccountState();
  });
}

function bindEvents() {
  ui.copyUserId?.addEventListener("click", onCopyUserIdClick);
  ui.sendReset?.addEventListener("click", onSendResetClick);
  ui.signOut?.addEventListener("click", onSignOutClick);
  ui.deleteAccount?.addEventListener("click", onDeleteAccountClick);
}

async function refreshAccountState() {
  try {
    currentUser = await getSessionUser(supabaseClient);
    currentProfile = await loadProfileSafely(currentUser);
    renderAccountState();

    if (currentUser) {
      setStatus("Account overview loaded.", "success", {
        toast: false
      });
    } else {
      setStatus("Not signed in yet. Create an account or log in to manage cloud features.", "info", {
        toast: false
      });
    }
  } catch (error) {
    setStatus(`Account load warning: ${formatSupabaseError(error)}`, "warning");
  }
}

async function loadProfileSafely(user) {
  if (!user) {
    return null;
  }

  try {
    return await getProfileRecord(supabaseClient, user);
  } catch (error) {
    setStatus(`Profile lookup warning: ${formatSupabaseError(error)}`, "warning", {
      toast: false
    });
    return null;
  }
}

function renderAccountState() {
  const signedIn = Boolean(currentUser);

  if (ui.guestView) {
    ui.guestView.hidden = signedIn;
  }
  if (ui.userView) {
    ui.userView.hidden = !signedIn;
  }

  if (!signedIn || !currentUser) {
    revealSection(ui.guestView);
    setActionsEnabled(false);
    return;
  }

  const displayName = getUserDisplayName(currentUser, currentProfile);
  const email = getUserEmail(currentUser, currentProfile);
  const avatar = buildAvatarText(displayName || email || "U");

  if (ui.userAvatar) {
    ui.userAvatar.textContent = avatar;
  }
  if (ui.userDisplayName) {
    ui.userDisplayName.textContent = displayName;
  }
  if (ui.userEmail) {
    ui.userEmail.textContent = email;
  }
  if (ui.username) {
    ui.username.textContent = currentProfile?.username || displayName || "Not available";
  }
  if (ui.userSince) {
    ui.userSince.textContent = formatDate(currentProfile?.created_at);
  }
  if (ui.userUpdatedAt) {
    ui.userUpdatedAt.textContent = formatDateTime(currentProfile?.updated_at);
  }

  revealSection(ui.userView);
  setActionsEnabled(true);
}

async function onCopyUserIdClick() {
  if (!currentUser?.id) {
    setStatus("Sign in first to copy your account ID.", "warning");
    return;
  }

  try {
    await copyText(currentUser.id);
    setStatus("Account ID copied to clipboard.", "success");
  } catch (error) {
    setStatus(`Copy failed: ${formatSupabaseError(error)}`, "error");
  }
}

async function onSendResetClick() {
  if (!ensureSignedIn()) {
    return;
  }

  setActionsEnabled(false);
  try {
    await sendPasswordResetForCurrentUser(supabaseClient, currentUser);
    setStatus("Password reset email sent. Check your inbox and spam folder.", "success");
  } catch (error) {
    setStatus(`Password reset failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    renderAccountState();
  }
}

async function onSignOutClick() {
  if (!supabaseClient) {
    return;
  }

  setActionsEnabled(false);
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }

    currentUser = null;
    currentProfile = null;
    renderAccountState();
    setStatus("Signed out successfully.", "success");
  } catch (error) {
    setStatus(`Sign-out failed: ${formatSupabaseError(error)}`, "error");
    renderAccountState();
  }
}

async function onDeleteAccountClick() {
  if (!ensureSignedIn()) {
    return;
  }

  const confirmed = window.confirm("Delete your account and linked cloud projects permanently?");
  if (!confirmed) {
    return;
  }

  setActionsEnabled(false);
  try {
    const { error } = await supabaseClient.rpc("delete_current_account");
    if (error) {
      throw error;
    }

    await supabaseClient.auth.signOut();
    currentUser = null;
    currentProfile = null;
    renderAccountState();
    setStatus("Account deleted successfully.", "success");
  } catch (error) {
    setStatus(`Account deletion failed: ${formatSupabaseError(error)}`, "error");
    renderAccountState();
  }
}

function ensureSignedIn() {
  if (currentUser) {
    return true;
  }

  setStatus("Sign in first to manage account actions.", "warning");
  return false;
}

function setActionsEnabled(enabled) {
  [ui.copyUserId, ui.sendReset, ui.signOut, ui.deleteAccount].forEach((button) => {
    if (button) {
      button.disabled = !enabled;
    }
  });
}

function revealSection(section) {
  section?.querySelectorAll?.("[data-reveal]").forEach((node) => {
    node.classList.add("is-visible");
  });
}

function setStatus(message, severity = "info", options = {}) {
  if (!ui.status) {
    return;
  }

  ui.status.textContent = message;
  ui.status.classList.remove("status-info", "status-success", "status-warning", "status-error");
  ui.status.classList.add(`status-${severity}`);
  if (options.toast === false) {
    return;
  }

  window.text2scratchToast?.show?.({
    severity,
    title: severity === "success" ? "Account updated" : severity === "error" ? "Account issue" : "Account",
    description: message
  });
}
