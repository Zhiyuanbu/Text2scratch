import { describe, expect, it } from "vitest";
import { consumeRateLimit, runRateLimited } from "./rateLimit";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key) || null : null;
    },
    key(index) {
      return [...store.keys()][index] || null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    }
  };
}

describe("rateLimit", () => {
  it("blocks requests after the configured limit", () => {
    const storage = createMemoryStorage();
    const timestamps = [1_000, 2_000, 3_000];
    let index = 0;
    const now = () => timestamps[index++] || timestamps[timestamps.length - 1];

    const first = consumeRateLimit("test.scope", {
      maxRequests: 2,
      windowMs: 10_000,
      storage,
      now
    });
    const second = consumeRateLimit("test.scope", {
      maxRequests: 2,
      windowMs: 10_000,
      storage,
      now
    });
    const third = consumeRateLimit("test.scope", {
      maxRequests: 2,
      windowMs: 10_000,
      storage,
      now
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("dedupes in-flight tasks for the same key", async () => {
    let calls = 0;

    const task = () =>
      runRateLimited(
        {
          key: "test.dedupe",
          max: 3,
          windowMs: 10_000,
          message: "Too many requests."
        },
        async () => {
          calls += 1;
          await new Promise((resolve) => setTimeout(resolve, 5));
          return "done";
        }
      );

    const [first, second] = await Promise.all([task(), task()]);
    expect(first).toBe("done");
    expect(second).toBe("done");
    expect(calls).toBe(1);
  });
});
