import { describe, expect, it } from "vitest";
import {
  countNewbiesInQueue,
  createNextMatchForCourt,
  isNewbieOnlyGroup,
  partitionNewbieUnits,
  pickFourWithSkillSpread,
  selectNextFourPlayers,
  type QueuePlayer,
} from "@/lib/queue/queue-engine";
import { buildQueueUnits } from "@/lib/player-partners";
import type { PlayerSkillLevel } from "@/types";

const BASE = "2026-01-01T10:00:00.000Z";

function makePlayer(
  id: string,
  skillLevel: PlayerSkillLevel,
  overrides: Partial<QueuePlayer> = {}
): QueuePlayer {
  return {
    id,
    name: id,
    skillLevel,
    status: "Waiting",
    gamesPlayed: 0,
    checkedInAt: BASE,
    lastPlayedAt: null,
    joinedAt: BASE,
    isActive: true,
    partnerId: null,
    ...overrides,
  };
}

const defaultSettings = {
  paymentRequired: false,
  allowUnpaidInQueue: true,
  skillMatchingMode: "Balanced" as const,
};

describe("partitionNewbieUnits", () => {
  it("keeps mixed-skill partner pairs in main lane", () => {
    const players = [
      makePlayer("n1", "Newbie", { partnerId: "b1" }),
      makePlayer("b1", "Beginner", { partnerId: "n1" }),
      makePlayer("n2", "Newbie"),
    ];
    const units = buildQueueUnits(players);
    const { newbieUnits, mainUnits } = partitionNewbieUnits(units);

    expect(newbieUnits).toHaveLength(1);
    expect(newbieUnits[0].map((p) => p.id)).toEqual(["n2"]);
    expect(mainUnits).toHaveLength(1);
    expect(mainUnits[0].map((p) => p.id)).toEqual(["n1", "b1"]);
  });
});

describe("selectNextFourPlayers", () => {
  it("picks newbie-only group when 4+ newbies are waiting", () => {
    const players = [
      ...["n1", "n2", "n3", "n4", "n5"].map((id) => makePlayer(id, "Newbie")),
      ...["a1", "a2", "a3", "a4"].map((id) => makePlayer(id, "Advanced")),
    ];

    const picked = selectNextFourPlayers(players, defaultSettings);
    expect(picked).not.toBeNull();
    expect(picked!.every((p) => p.skillLevel === "Newbie")).toBe(true);
    expect(isNewbieOnlyGroup(picked!)).toBe(true);
  });

  it("spills newbies into main pool when fewer than 4 newbies", () => {
    const players = [
      makePlayer("n1", "Newbie"),
      makePlayer("n2", "Newbie"),
      makePlayer("n3", "Newbie"),
      makePlayer("b1", "Beginner"),
      makePlayer("b2", "Beginner"),
      makePlayer("b3", "Novice"),
      makePlayer("b4", "Novice"),
    ];

    const picked = selectNextFourPlayers(players, defaultSettings);
    expect(picked).not.toBeNull();
    expect(picked!.filter((p) => p.skillLevel === "Newbie").length).toBeGreaterThan(
      0
    );
    expect(isNewbieOnlyGroup(picked!)).toBe(false);
  });

  it("rejects wide skill spread in Strict mode on main pool", () => {
    const players = [
      makePlayer("n1", "Newbie"),
      makePlayer("a1", "Advanced"),
      makePlayer("a2", "Advanced"),
      makePlayer("a3", "Advanced"),
    ];

    const picked = selectNextFourPlayers(players, {
      ...defaultSettings,
      skillMatchingMode: "Strict",
    });
    expect(picked).toBeNull();
  });
});

describe("createNextMatchForCourt", () => {
  it("flags newbie court on assignment", () => {
    const players = ["n1", "n2", "n3", "n4"].map((id) =>
      makePlayer(id, "Newbie")
    );
    const match = createNextMatchForCourt(players, defaultSettings);
    expect(match?.isNewbieCourt).toBe(true);
  });
});

describe("pickFourWithSkillSpread", () => {
  it("prefers earlier units when multiple valid groups exist", () => {
    const units = buildQueueUnits([
      makePlayer("b1", "Beginner"),
      makePlayer("b2", "Beginner"),
      makePlayer("b3", "Novice"),
      makePlayer("b4", "Novice"),
      makePlayer("a1", "Advanced"),
      makePlayer("a2", "Advanced"),
      makePlayer("a3", "Advanced"),
      makePlayer("a4", "Advanced"),
    ]);

    const picked = pickFourWithSkillSpread(units, 2);
    expect(picked?.map((p) => p.id)).toEqual(["b1", "b2", "b3", "b4"]);
  });
});

describe("countNewbiesInQueue", () => {
  it("counts only eligible newbies", () => {
    const players = [
      makePlayer("n1", "Newbie"),
      makePlayer("n2", "Newbie", { status: "Registered" }),
      makePlayer("b1", "Beginner"),
    ];
    expect(countNewbiesInQueue(players)).toBe(1);
  });
});
