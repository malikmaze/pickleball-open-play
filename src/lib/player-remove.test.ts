import { describe, expect, it } from "vitest";
import { isWalkInPlayer, WALK_IN_SOURCE_NOTE } from "@/lib/player-import";
import { resolvePlayerRemove, summarizeBulkRemove, bulkRemoveDialogCopy } from "@/lib/player-remove";
import type { Player } from "@/types";

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    sessionId: "s1",
    name: "Alex",
    skillLevel: "Beginner",
    status: "Present",
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    isActive: true,
    joinedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("isWalkInPlayer", () => {
  it("detects walk-in source note", () => {
    expect(isWalkInPlayer({ note: WALK_IN_SOURCE_NOTE })).toBe(true);
    expect(isWalkInPlayer({ note: "Bulk import" })).toBe(false);
  });
});

describe("resolvePlayerRemove", () => {
  it("moves queue players back to check-in", () => {
    const plan = resolvePlayerRemove(player(), "queue");
    expect(plan).toMatchObject({ action: "uncheck", destructive: false });
  });

  it("deletes walk-ins from check-in", () => {
    const plan = resolvePlayerRemove(
      player({ note: WALK_IN_SOURCE_NOTE, status: "Present" }),
      "checkin"
    );
    expect(plan).toMatchObject({ action: "delete", destructive: true });
  });

  it("moves booked queue players back to booked list from check-in", () => {
    const plan = resolvePlayerRemove(
      player({ status: "Waiting", note: "Bulk import" }),
      "checkin"
    );
    expect(plan).toMatchObject({ action: "uncheck" });
  });

  it("blocks removing players on court", () => {
    const plan = resolvePlayerRemove(player({ status: "Playing" }), "queue");
    expect(plan).toHaveProperty("blockedReason");
  });
});

describe("summarizeBulkRemove", () => {
  it("counts mixed uncheck and delete actions", () => {
    const summary = summarizeBulkRemove(
      [
        player({ id: "p1", status: "Present" }),
        player({
          id: "p2",
          status: "Registered",
          note: WALK_IN_SOURCE_NOTE,
        }),
      ],
      "checkin"
    );
    expect(summary.uncheckCount).toBe(1);
    expect(summary.deleteCount).toBe(1);
    expect(summary.entries).toHaveLength(2);
  });

  it("skips players on court", () => {
    const summary = summarizeBulkRemove(
      [player({ status: "Playing" }), player({ id: "p2", status: "Present" })],
      "queue"
    );
    expect(summary.entries).toHaveLength(1);
    expect(summary.blocked).toHaveLength(1);
  });
});

describe("bulkRemoveDialogCopy", () => {
  it("describes bulk queue removal", () => {
    const summary = summarizeBulkRemove(
      [player({ id: "p1" }), player({ id: "p2" })],
      "queue"
    );
    const copy = bulkRemoveDialogCopy(summary, "queue");
    expect(copy.title).toContain("2 players");
    expect(copy.description).toContain("check-in");
  });
});
