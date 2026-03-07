import {
  buildAvatarText,
  canUseUsername,
  copyText,
  createSupabaseClient,
  formatDate,
  formatDateTime,
  formatSupabaseError,
  getProfileRecord,
  getSessionUser,
  getUserDisplayName,
  getUserEmail,
  isValidUsername,
  normalizeUsername,
  updateUserProfile
} from "./account-shared.js";

const ui = {
  guestView: document.getElementById("profileGuestView"),
  userView: document.getElementById("profileUserView"),
  form: document.getElementById("profileForm"),
  avatar: document.getElementById("profileUserAvatar"),
  displayName: document.getElementById("profileUserDisplayName"),
  email: document.getElementById("profileUserEmail"),
  usernameInput: document.getElementById("profileUsernameInput"),
  emailInput: document.getElementById("profileEmailInput"),
  save: document.getElementById("profileSaveBtn"),
  copyUserId: document.getElementById("profileCopyUserIdBtn"),
  status: document.getElementById("profileStatus"),
  summaryUsername: document.getElementById("profileSummaryUsername"),
  summaryCreatedAt: document.getElementById("profileSummaryCreatedAt"),
  summaryUpdatedAt: document.getElementById("profileSummaryUpdatedAt")
};

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

init().catch((error) => {
  setStatus(`Startup error: ${formatSupabaseError(error)}`, "error");
});

async function init() {
  if (!ui.guestView || !ui.userView || !ui.status) {
    return;
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    setStatus(error.message, "error");
    setFormEnabled(false);
    return;
  }

  bindEvents();
  await refreshProfileState();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    currentProfile = await loadProfileSafely(currentUser);
    renderProfileState();
  });
}

function bindEvents() {
  ui.form?.addEventListener("submit", onProfileSubmit);
  ui.copyUserId?.addEventListener("click", onCopyUserIdClick);
  ui.usernameInput?.addEventListener("blur", () => {
    if (!ui.usernameInput) {
      return;
    }
    ui.usernameInput.value = normalizeUsername(ui.usernameInput.value);
  });
}

async function refreshProfileState() {
  try {
    currentUser = await getSessionUser(supabaseClient);
    currentProfile = await loadProfileSafely(currentUser);
    renderProfileState();

    if (currentUser) {
      setStatus("Profile loaded.", "success", {
        toast: false
      });
    } else {
      setStatus("Sign in to edit your profile.", "info", {
        toast: false
      });
    }
  } catch (error) {
    setStatus(`Profile load warning: ${formatSupabaseError(error)}`, "warning");
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

function renderProfileState() {
  const signedIn = Boolean(currentUser);

  ui.guestView.hidden = signedIn;
  ui.userView.hidden = !signedIn;

  if (!signedIn || !currentUser) {
    revealSection(ui.guestView);
    setFormEnabled(false);
    updateMetadata(null, null);
    return;
  }

  const displayName = getUserDisplayName(currentUser, currentProfile);
  const email = getUserEmail(currentUser, currentProfile);
  const username = currentProfile?.username || normalizeUsername(displayName) || "user";

  if (ui.avatar) {
    ui.avatar.textContent = buildAvatarText(displayName || email);
  }
  if (ui.displayName) {
    ui.displayName.textContent = displayName;
  }
  if (ui.email) {
    ui.email.textContent = email;
  }
  if (ui.usernameInput) {
    ui.usernameInput.value = username;
  }
  if (ui.emailInput) {
    ui.emailInput.value = email === "No email" ? "" : email;
  }

  updateMetadata(currentUser, currentProfile || {
    username,
    created_at: "",
    updated_at: ""
  });
  revealSection(ui.userView);
  setFormEnabled(true);
}

function updateMetadata(user, profile) {
  if (ui.summaryUsername) {
    ui.summaryUsername.textContent = profile?.username || "Not available";
  }
  if (ui.summaryCreatedAt) {
    ui.summaryCreatedAt.textContent = formatDate(profile?.created_at);
  }
  if (ui.summaryUpdatedAt) {
    ui.summaryUpdatedAt.textContent = formatDateTime(profile?.updated_at);
  }
  if (ui.copyUserId) {
    ui.copyUserId.disabled = !user?.id;
  }
}

async function onProfileSubmit(event) {
  event.preventDefault();
  if (!currentUser || !ui.usernameInput) {
    setStatus("Sign in first to update your profile.", "warning");
    return;
  }

  const normalized = normalizeUsername(ui.usernameInput.value);
  ui.usernameInput.value = normalized;

  if (!isValidUsername(normalized)) {
    setStatus("Username must be 3 to 32 characters using lowercase letters, numbers, or underscores.", "warning");
    return;
  }

  setFormEnabled(false);
  try {
    const currentUsername = currentProfile?.username || currentUser?.user_metadata?.username || "";
    const usernameAvailable = await canUseUsername(supabaseClient, normalized, currentUsername);
    if (!usernameAvailable) {
      setStatus("That username is already in use. Try another one.", "warning");
      return;
    }

    currentProfile = await updateUserProfile(supabaseClient, currentUser, {
      username: normalized
    });

    currentUser = await getSessionUser(supabaseClient);
    renderProfileState();
    setStatus("Profile saved successfully.", "success");
  } catch (error) {
    setStatus(`Profile update failed: ${formatSupabaseError(error)}`, "error");
  } finally {
    setFormEnabled(Boolean(currentUser));
  }
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

function setFormEnabled(enabled) {
  [ui.usernameInput, ui.save, ui.copyUserId].forEach((element) => {
    if (element) {
      element.disabled = !enabled;
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
    title: severity === "success" ? "Profile updated" : severity === "error" ? "Profile issue" : "Profile",
    description: message
  });
}
