import {
  CLOUD_TABLE,
  SHARE_QUERY_PARAM,
  createSupabaseClient,
  formatSupabaseError
} from "./supabase-client.js";

const ui = {
  search: document.getElementById("communitySearchInput"),
  sort: document.getElementById("communitySortSelect"),
  refresh: document.getElementById("communityRefreshBtn"),
  stats: document.getElementById("communityStats"),
  grid: document.getElementById("communityGrid")
};

let supabaseClient = null;
let projects = [];

init().catch((error) => {
  renderError(`Community startup failed: ${error.message}`);
});

async function init() {
  if (!ui.grid || !ui.stats || !ui.search || !ui.sort || !ui.refresh) {
    return;
  }

  try {
    supabaseClient = createSupabaseClient();
  } catch (error) {
    renderError(error.message);
    return;
  }

  ui.search.addEventListener("input", render);
  ui.sort.addEventListener("change", render);
  ui.refresh.addEventListener("click", loadCommunityProjects);

  await loadCommunityProjects();
}

async function loadCommunityProjects() {
  if (!supabaseClient) {
    return;
  }

  ui.refresh.disabled = true;
  ui.grid.innerHTML = '<p class="support-text">Loading community projects...</p>';

  try {
    const { data, error } = await supabaseClient
      .from(CLOUD_TABLE)
      .select("title,share_slug,owner_username,updated_at")
      .eq("is_public", true)
      .not("share_slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    projects = Array.isArray(data) ? data : [];
    render();
  } catch (error) {
    renderError(`Could not load community projects: ${error.message}`);
  } finally {
    ui.refresh.disabled = false;
  }
}

function render() {
  const query = ui.search.value.trim().toLowerCase();
  const sortMode = ui.sort.value;

  const filtered = projects
    .filter((project) => {
      if (!query) {
        return true;
      }

      const title = String(project?.title || "").toLowerCase();
      const creator = String(project?.owner_username || "").toLowerCase();
      return title.includes(query) || creator.includes(query);
    })
    .sort((a, b) => compareProjects(a, b, sortMode));

  ui.stats.innerHTML = "";
  const statsText = document.createElement("span");
  statsText.textContent = `Showing ${filtered.length} public project${filtered.length === 1 ? "" : "s"}.`;
  ui.stats.appendChild(statsText);

  ui.grid.innerHTML = "";
  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "support-text";
    empty.textContent = "No community projects match your current filters.";
    ui.grid.appendChild(empty);
    return;
  }

  filtered.forEach((project) => {
    ui.grid.appendChild(renderProjectCard(project));
  });
}

function compareProjects(a, b, sortMode) {
  if (sortMode === "title") {
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  }

  if (sortMode === "creator") {
    return String(a?.owner_username || "").localeCompare(String(b?.owner_username || ""));
  }

  const aDate = Number(new Date(a?.updated_at));
  const bDate = Number(new Date(b?.updated_at));
  return bDate - aDate;
}

function renderProjectCard(project) {
  const title = String(project?.title || "Untitled").trim() || "Untitled";
  const creator = String(project?.owner_username || "unknown").trim() || "unknown";
  const shareSlug = String(project?.share_slug || "").trim();
  const updatedAt = formatDate(project?.updated_at);
  const shareUrl = buildShareProjectUrl(shareSlug);

  const card = document.createElement("article");
  card.className = "community-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  const meta = document.createElement("p");
  meta.className = "support-text";
  meta.textContent = `By ${creator} · Updated ${updatedAt}`;
  card.appendChild(meta);

  const badges = document.createElement("div");
  badges.className = "pill-row";

  const creatorPill = document.createElement("span");
  creatorPill.className = "pill";
  creatorPill.textContent = creator;
  badges.appendChild(creatorPill);

  const sharedPill = document.createElement("span");
  sharedPill.className = "pill";
  sharedPill.textContent = "Shared";
  badges.appendChild(sharedPill);

  card.appendChild(badges);

  const actions = document.createElement("div");
  actions.className = "community-actions";

  const openButton = document.createElement("a");
  openButton.href = shareUrl;
  openButton.className = "primary-btn";
  openButton.innerHTML = '<i class="fas fa-eye"></i> Open Read-Only';
  actions.appendChild(openButton);

  const forkButton = document.createElement("a");
  forkButton.href = shareUrl;
  forkButton.className = "secondary-btn";
  forkButton.innerHTML = '<i class="fas fa-code-branch"></i> Open and Fork';
  actions.appendChild(forkButton);

  card.appendChild(actions);

  return card;
}

function buildShareProjectUrl(slug) {
  const url = new URL("index.html", window.location.href);
  url.searchParams.set(SHARE_QUERY_PARAM, slug);
  return url.toString();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return date.toLocaleString();
}

function renderError(message) {
  if (!ui.grid || !ui.stats) {
    return;
  }

  notify(message, "error");
  ui.stats.innerHTML = "";
  ui.grid.innerHTML = "";

  const error = document.createElement("p");
  error.className = "support-text";
  error.textContent = "Could not load community projects right now.";
  ui.grid.appendChild(error);
}

function notify(message, severity = "info") {
  window.text2scratchToast?.show?.(message, severity);
}
