export type ForumBoard = "collab" | "dev" | "higher";

export interface ForumReply {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  board: ForumBoard;
  title: string;
  body: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  locked?: boolean;
  replies: ForumReply[];
}

export interface CreateForumThreadInput {
  board: ForumBoard;
  title: string;
  body: string;
  author: string;
  tags?: string[];
  pinned?: boolean;
}

export interface CreateForumReplyInput {
  threadId: string;
  author: string;
  body: string;
}

const FORUM_STORAGE_KEY = "text2scratch.community.forums.v1";

export function getDefaultForumThreads(): ForumThread[] {
  return [
    {
      id: "thread-collab-art-team",
      board: "collab",
      title: "Looking for pixel artists for a story platformer",
      body:
        "I have the core movement and scene scripting done in text2scratch. I need help with character portraits, UI frames, and two boss sprites.",
      author: "TigerDev",
      tags: ["Art", "Story", "Collab"],
      createdAt: "2026-03-24T18:10:00.000Z",
      updatedAt: "2026-03-28T20:45:00.000Z",
      replies: [
        {
          id: "reply-collab-art-team-1",
          author: "PixelMint",
          body: "I can cover UI frames and title cards. Share the palette constraints when ready.",
          createdAt: "2026-03-28T20:45:00.000Z"
        }
      ]
    },
    {
      id: "thread-dev-scope-guide",
      board: "dev",
      title: "Best practices for variable scope in large text2scratch projects",
      body:
        "I am splitting one game into multiple sprites and broadcasts. What naming rules are people using to keep globals and sprite-only variables readable?",
      author: "Zhibu378",
      tags: ["Variables", "Architecture", "Tutorial"],
      createdAt: "2026-03-20T15:00:00.000Z",
      updatedAt: "2026-03-29T09:12:00.000Z",
      replies: [
        {
          id: "reply-dev-scope-guide-1",
          author: "StackSprite",
          body: "I prefix globals with g_ and sprite-owned state with the sprite name. It keeps imports readable.",
          createdAt: "2026-03-29T09:12:00.000Z"
        }
      ]
    },
    {
      id: "thread-higher-roadmap",
      board: "higher",
      title: "Higher Forum roadmap: moderation, cloud reliability, and publishing",
      body:
        "Use this thread for advanced planning work. Share infrastructure notes, moderation policy ideas, and production rollout concerns here.",
      author: "Admin_Root",
      tags: ["Roadmap", "Ops", "Announcements"],
      createdAt: "2026-03-18T12:00:00.000Z",
      updatedAt: "2026-03-29T16:30:00.000Z",
      pinned: true,
      replies: [
        {
          id: "reply-higher-roadmap-1",
          author: "CloudMaster",
          body: "We should keep a fallback cache for cloud project lists so the editor stays usable during transient failures.",
          createdAt: "2026-03-29T16:30:00.000Z"
        }
      ]
    }
  ];
}

export function readForumThreads(storage = resolveStorage()) {
  if (!storage) {
    return getDefaultForumThreads();
  }

  try {
    const rawValue = storage.getItem(FORUM_STORAGE_KEY);
    if (!rawValue) {
      const fallback = getDefaultForumThreads();
      writeForumThreads(fallback, storage);
      return fallback;
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return getDefaultForumThreads();
    }

    const normalized = parsed
      .map(normalizeThread)
      .filter((thread): thread is ForumThread => Boolean(thread));

    return normalized.length > 0 ? normalized : getDefaultForumThreads();
  } catch {
    return getDefaultForumThreads();
  }
}

export function writeForumThreads(threads: ForumThread[], storage = resolveStorage()) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FORUM_STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage failures and keep the in-memory state.
  }
}

export function createForumThread(threads: ForumThread[], input: CreateForumThreadInput, now = new Date()) {
  const timestamp = now.toISOString();
  const nextThread: ForumThread = {
    id: `thread-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    board: input.board,
    title: sanitizeForumText(input.title, 120),
    body: sanitizeForumText(input.body, 1_500),
    author: sanitizeForumText(input.author, 48) || "anonymous",
    tags: normalizeTags(input.tags || []),
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: Boolean(input.pinned),
    replies: []
  };

  return [nextThread, ...threads];
}

export function addForumReply(threads: ForumThread[], input: CreateForumReplyInput, now = new Date()) {
  const timestamp = now.toISOString();
  const nextReply: ForumReply = {
    id: `reply-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    author: sanitizeForumText(input.author, 48) || "anonymous",
    body: sanitizeForumText(input.body, 1_200),
    createdAt: timestamp
  };

  return threads.map((thread) => {
    if (thread.id !== input.threadId) {
      return thread;
    }

    return {
      ...thread,
      updatedAt: timestamp,
      replies: [...thread.replies, nextReply]
    };
  });
}

export function filterForumThreads(threads: ForumThread[], board: ForumBoard, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return threads
    .filter((thread) => thread.board === board)
    .filter((thread) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystacks = [
        thread.title,
        thread.body,
        thread.author,
        thread.tags.join(" "),
        ...thread.replies.map((reply) => `${reply.author} ${reply.body}`)
      ].map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(normalizedQuery));
    })
    .sort(compareForumThreads);
}

export function countForumPosts(threads: ForumThread[]) {
  return threads.reduce((total, thread) => total + 1 + thread.replies.length, 0);
}

export function compareForumThreads(left: ForumThread, right: ForumThread) {
  if (Boolean(left.pinned) !== Boolean(right.pinned)) {
    return left.pinned ? -1 : 1;
  }

  return Number(new Date(right.updatedAt)) - Number(new Date(left.updatedAt));
}

function normalizeThread(value: unknown): ForumThread | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawThread = value as Partial<ForumThread>;
  const board = normalizeBoard(rawThread.board);
  const title = sanitizeForumText(rawThread.title, 120);
  const body = sanitizeForumText(rawThread.body, 1_500);

  if (!board || !title || !body) {
    return null;
  }

  return {
    id: sanitizeForumText(rawThread.id, 120) || `thread-${Date.now()}`,
    board,
    title,
    body,
    author: sanitizeForumText(rawThread.author, 48) || "anonymous",
    tags: normalizeTags(Array.isArray(rawThread.tags) ? rawThread.tags : []),
    createdAt: normalizeIsoDate(rawThread.createdAt),
    updatedAt: normalizeIsoDate(rawThread.updatedAt || rawThread.createdAt),
    pinned: Boolean(rawThread.pinned),
    locked: Boolean(rawThread.locked),
    replies: Array.isArray(rawThread.replies)
      ? rawThread.replies
          .map((reply) => normalizeReply(reply))
          .filter((reply): reply is ForumReply => Boolean(reply))
      : []
  };
}

function normalizeReply(value: unknown): ForumReply | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawReply = value as Partial<ForumReply>;
  const body = sanitizeForumText(rawReply.body, 1_200);
  if (!body) {
    return null;
  }

  return {
    id: sanitizeForumText(rawReply.id, 120) || `reply-${Date.now()}`,
    author: sanitizeForumText(rawReply.author, 48) || "anonymous",
    body,
    createdAt: normalizeIsoDate(rawReply.createdAt)
  };
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => sanitizeForumText(tag, 24))
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeBoard(value: unknown): ForumBoard | null {
  if (value === "collab" || value === "dev" || value === "higher") {
    return value;
  }
  return null;
}

function sanitizeForumText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeIsoDate(value: unknown) {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function resolveStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
