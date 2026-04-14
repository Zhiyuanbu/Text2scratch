import { describe, expect, it } from "vitest";
import { buildModerationSql, queueModerationAction, removeModerationAction } from "./moderation";

describe("moderation helpers", () => {
  it("queues the newest moderation action first", () => {
    const actions = queueModerationAction([], "restrict_account", "user_one", new Date("2026-03-30T12:00:00.000Z"));
    expect(actions[0]?.type).toBe("restrict_account");
    expect(actions[0]?.target).toBe("user_one");
  });

  it("builds SQL for network bans", () => {
    const [action] = queueModerationAction([], "network_ban", "127.0.0.1", new Date("2026-03-30T12:00:00.000Z"));
    expect(buildModerationSql(action!)).toBe("select public.admin_network_ban('127.0.0.1');");
  });

  it("removes queued actions by id", () => {
    const actions = queueModerationAction([], "restrict_account", "user_one", new Date("2026-03-30T12:00:00.000Z"));
    const trimmed = removeModerationAction(actions, actions[0]!.id);
    expect(trimmed).toHaveLength(0);
  });
});
