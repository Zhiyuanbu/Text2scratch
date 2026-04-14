import {
  FORUM_REPLIES_TABLE,
  FORUM_THREADS_TABLE,
  ensureSupabaseConfigured,
  formatSupabaseError,
  supabaseClient
} from "./supabase";

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

interface ForumThreadRow {
  id: string;
  board: ForumBoard;
  title: string;
  body: string;
  author_user_id?: string | null;
  author_username: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  pinned: boolean | null;
  locked: boolean | null;
}

interface ForumReplyRow {
  id: string;
  thread_id: string;
  author_user_id?: string | null;
  author_username: string | null;
  body: string;
  created_at: string;
}

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
      author: "StackSprite",
      tags: ["Variables", "Architecture", "Tutorial"],
      createdAt: "2026-03-20T15:00:00.000Z",
      updatedAt: "2026-03-29T09:12:00.000Z",
      replies: [
        {
          id: "reply-dev-scope-guide-1",
          author: "BuilderLoop",
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
      author: "AdminRoot",
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

export async function listForumThreads(limitRows = 200) {
  ensureSupabaseConfigured();

  const { data: threadRows, error: threadError } = await supabaseClient
    .from(FORUM_THREADS_TABLE)
    .select("id,board,title,body,author_user_id,author_username,tags,created_at,updated_at,pinned,locked")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(0, Math.max(limitRows - 1, 0));

  if (threadError) {
    throw new Error(formatSupabaseError(threadError));
  }

  const threads = Array.isArray(threadRows) ? threadRows as ForumThreadRow[] : [];
  const threadIds = threads.map((thread) => thread.id).filter(Boolean);
  if (threadIds.length === 0) {
    return [] as ForumThread[];
  }

  const { data: replyRows, error: replyError } = await supabaseClient
    .from(FORUM_REPLIES_TABLE)
    .select("id,thread_id,author_user_id,author_username,body,created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  if (replyError) {
    throw new Error(formatSupabaseError(replyError));
  }

  const repliesByThread = new Map<string, ForumReply[]>();
  for (const row of Array.isArray(replyRows) ? replyRows as ForumReplyRow[] : []) {
    const threadReplies = repliesByThread.get(row.thread_id) || [];
    threadReplies.push({
      id: row.id,
      author: sanitizeForumText(row.author_username, 48) || "anonymous",
      body: sanitizeForumText(row.body, 1_200),
      createdAt: normalizeIsoDate(row.created_at)
    });
    repliesByThread.set(row.thread_id, threadReplies);
  }

  return threads.map((row) => ({
    id: row.id,
    board: normalizeBoard(row.board) || "collab",
    title: sanitizeForumText(row.title, 120),
    body: sanitizeForumText(row.body, 1_500),
    author: sanitizeForumText(row.author_username, 48) || "anonymous",
    tags: normalizeTags(Array.isArray(row.tags) ? row.tags : []),
    createdAt: normalizeIsoDate(row.created_at),
    updatedAt: normalizeIsoDate(row.updated_at),
    pinned: Boolean(row.pinned),
    locked: Boolean(row.locked),
    replies: repliesByThread.get(row.id) || []
  }));
}

export async function submitForumThread(input: CreateForumThreadInput, authorUserId: string) {
  ensureSupabaseConfigured();

  const { error } = await supabaseClient
    .from(FORUM_THREADS_TABLE)
    .insert({
      board: input.board,
      title: sanitizeForumText(input.title, 120),
      body: sanitizeForumText(input.body, 1_500),
      author_user_id: authorUserId,
      author_username: sanitizeForumText(input.author, 48) || "anonymous",
      tags: normalizeTags(input.tags || []),
      pinned: Boolean(input.pinned)
    });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function submitForumReply(input: CreateForumReplyInput, authorUserId: string) {
  ensureSupabaseConfigured();

  const { error } = await supabaseClient
    .from(FORUM_REPLIES_TABLE)
    .insert({
      thread_id: input.threadId,
      author_user_id: authorUserId,
      author_username: sanitizeForumText(input.author, 48) || "anonymous",
      body: sanitizeForumText(input.body, 1_200)
    });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export function createForumThread(threads: ForumThread[], input: CreateForumThreadInput, now = new Date()) {
  const timestamp = now.toISOString();
  const nextThread: ForumThread = {
    id: createRecordId("thread"),
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
    id: createRecordId("reply"),
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

function createRecordId(prefix: "thread" | "reply") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}-${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  }

  return `${prefix}-${Date.now().toString(36)}-fallback`;
}
