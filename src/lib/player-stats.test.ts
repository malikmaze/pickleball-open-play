import { describe, expect, it } from "vitest";
import {
  assignmentRecordBracket,
  buildWinLossFromMatches,
  getRecordTier,
  rankTopPlayers,
} from "@/lib/player-stats";
import type { Player } from "@/types";

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    sessionId: "s1",
    name: "Alex",
    skillLevel: "Beginner",
    status: "Waiting",
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    isActive: true,
    joinedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("getRecordTier", () => {
  it("classifies winning and losing records", () => {
    expect(getRecordTier({ wins: 2, losses: 0 })).toBe("winning");
    expect(getRecordTier({ wins: 1, losses: 3 })).toBe("losing");
    expect(getRecordTier({ wins: 2, losses: 2 })).toBe("even");
    expect(getRecordTier({ wins: 0, losses: 0 })).toBe("unplayed");
  });
});

describe("rankTopPlayers", () => {
  it("ranks by wins then fewer losses", () => {
    const top = rankTopPlayers([
      player({ id: "a", name: "A", wins: 2, losses: 1, gamesPlayed: 3 }),
      player({ id: "b", name: "B", wins: 3, losses: 0, gamesPlayed: 3 }),
      player({ id: "c", name: "C", wins: 3, losses: 1, gamesPlayed: 4 }),
      player({ id: "d", name: "D", wins: 0, losses: 0, gamesPlayed: 0 }),
    ]);

    expect(top.map((t) => t.name)).toEqual(["B", "C", "A"]);
    expect(top[0].rank).toBe(1);
  });

  it("limits to top N", () => {
    const players = Array.from({ length: 8 }, (_, i) =>
      player({
        id: `p${i}`,
        name: `P${i}`,
        wins: 8 - i,
        losses: 0,
        gamesPlayed: 8 - i,
      })
    );
    expect(rankTopPlayers(players, 5)).toHaveLength(5);
  });
});

describe("buildWinLossFromMatches", () => {
  it("counts wins and losses from finished matches", () => {
    const stats = buildWinLossFromMatches([
      {
        id: "m1",
        sessionId: "s1",
        teamAPlayer1Id: "a1",
        teamAPlayer2Id: "a2",
        teamBPlayer1Id: "b1",
        teamBPlayer2Id: "b2",
        winnerTeam: "A",
        status: "finished",
        createdAt: "2026-01-01T10:00:00.000Z",
      },
    ]);

    expect(stats.get("a1")).toEqual({ wins: 1, losses: 0 });
    expect(stats.get("b1")).toEqual({ wins: 0, losses: 1 });
  });
});

describe("assignmentRecordBracket", () => {
  it("returns tier when all four share it", () => {
    expect(
      assignmentRecordBracket([
        { wins: 2, losses: 0 },
        { wins: 1, losses: 0 },
        { wins: 3, losses: 1 },
        { wins: 2, losses: 1 },
      ])
    ).toBe("winning");
  });

  it("returns null for mixed brackets", () => {
    expect(
      assignmentRecordBracket([
        { wins: 2, losses: 0 },
        { wins: 0, losses: 2 },
      ])
    ).toBeNull();
  });
});
