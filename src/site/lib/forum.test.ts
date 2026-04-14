import { describe, expect, it } from "vitest";
import {
  addForumReply,
  countForumPosts,
  createForumThread,
  filterForumThreads,
  getDefaultForumThreads
} from "./forum";

describe("forum helpers", () => {
  it("creates new threads at the top of the list", () => {
    const threads = createForumThread(getDefaultForumThreads(), {
      board: "collab",
      title: "Need a composer",
      body: "Looking for soundtrack help.",
      author: "AudioNode",
      tags: ["Music"]
    }, new Date("2026-03-30T12:00:00.000Z"));

    expect(threads[0]?.title).toBe("Need a composer");
    expect(threads[0]?.board).toBe("collab");
  });

  it("adds replies and updates the thread timestamp", () => {
    const threads = getDefaultForumThreads();
    const updated = addForumReply(threads, {
      threadId: threads[0]!.id,
      author: "ReplyUser",
      body: "I can help."
    }, new Date("2026-03-30T12:00:00.000Z"));

    expect(updated[0]?.replies.at(-1)?.author).toBe("ReplyUser");
    expect(updated[0]?.updatedAt).toBe("2026-03-30T12:00:00.000Z");
  });

  it("filters threads by board and search text", () => {
    const threads = getDefaultForumThreads();
    const filtered = filterForumThreads(threads, "higher", "moderation");

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.board).toBe("higher");
  });

  it("counts threads and replies together", () => {
    expect(countForumPosts(getDefaultForumThreads())).toBeGreaterThan(getDefaultForumThreads().length);
  });
});
