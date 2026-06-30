import type { Match, Player } from "@/types";

/** Win/loss bracket used for competitive matching. */
export type RecordTier = "unplayed" | "winning" | "losing" | "even";

export interface RecordTrackable {
  wins: number;
  losses: number;
}

export function getRecordTier(player: RecordTrackable): RecordTier {
  const decided = player.wins + player.losses;
  if (decided === 0) return "unplayed";
  if (player.wins > player.losses) return "winning";
  if (player.losses > player.wins) return "losing";
  return "even";
}

export function recordTierLabel(tier: RecordTier): string {
  switch (tier) {
    case "winning":
      return "Winners bracket";
    case "losing":
      return "Rebuild bracket";
    case "even":
      return "Even record";
    case "unplayed":
      return "First games";
  }
}

export function formatWinLoss(player: RecordTrackable): string {
  return `${player.wins}–${player.losses}`;
}

export interface PlayerStanding {
  id: string;
  name: string;
  skillLevel: Player["skillLevel"];
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: number;
  winRate: number;
}

export function comparePlayerStandings(
  a: Pick<Player, "wins" | "losses" | "gamesPlayed">,
  b: Pick<Player, "wins" | "losses" | "gamesPlayed">
): number {
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (a.losses !== b.losses) return a.losses - b.losses;
  return b.gamesPlayed - a.gamesPlayed;
}

export function rankTopPlayers(
  players: Player[],
  limit = 5
): PlayerStanding[] {
  const ranked = players
    .filter((p) => p.wins + p.losses > 0)
    .sort(comparePlayerStandings)
    .slice(0, limit);

  return ranked.map((player, index) => {
    const decided = player.wins + player.losses;
    return {
      id: player.id,
      name: player.name,
      skillLevel: player.skillLevel,
      wins: player.wins,
      losses: player.losses,
      gamesPlayed: player.gamesPlayed,
      rank: index + 1,
      winRate: decided > 0 ? player.wins / decided : 0,
    };
  });
}

export function assignmentRecordBracket(
  players: RecordTrackable[]
): RecordTier | null {
  if (players.length === 0) return null;
  const tier = getRecordTier(players[0]);
  return players.every((p) => getRecordTier(p) === tier) ? tier : null;
}

export const RECORD_TIER_MATCH_PRIORITY: RecordTier[] = [
  "winning",
  "losing",
  "even",
  "unplayed",
];

export function unitRecordTier<T extends RecordTrackable>(
  unit: T[]
): RecordTier | "mixed" {
  const tiers = new Set(unit.map((p) => getRecordTier(p)));
  if (tiers.size === 1) return [...tiers][0];
  return "mixed";
}

export function partitionUnitsByRecordTier<T extends RecordTrackable>(
  units: T[][]
): {
  byTier: Record<RecordTier, T[][]>;
  mixed: T[][];
} {
  const byTier: Record<RecordTier, T[][]> = {
    unplayed: [],
    winning: [],
    losing: [],
    even: [],
  };
  const mixed: T[][] = [];

  for (const unit of units) {
    const tier = unitRecordTier(unit);
    if (tier === "mixed") mixed.push(unit);
    else byTier[tier].push(unit);
  }

  return { byTier, mixed };
}

export function buildWinLossFromMatches(
  matches: Match[]
): Map<string, { wins: number; losses: number }> {
  const stats = new Map<string, { wins: number; losses: number }>();

  const bump = (playerId: string, field: "wins" | "losses") => {
    const current = stats.get(playerId) ?? { wins: 0, losses: 0 };
    stats.set(playerId, { ...current, [field]: current[field] + 1 });
  };

  for (const match of matches) {
    if (match.status !== "finished" || !match.winnerTeam) continue;

    const winners =
      match.winnerTeam === "A"
        ? [match.teamAPlayer1Id, match.teamAPlayer2Id]
        : [match.teamBPlayer1Id, match.teamBPlayer2Id];
    const losers =
      match.winnerTeam === "A"
        ? [match.teamBPlayer1Id, match.teamBPlayer2Id]
        : [match.teamAPlayer1Id, match.teamAPlayer2Id];

    for (const id of winners) bump(id, "wins");
    for (const id of losers) bump(id, "losses");
  }

  return stats;
}

/** Fill win/loss from finished matches when DB columns are missing or stale. */
export function enrichPlayersWithMatchStats(
  players: Player[],
  matches: Match[]
): Player[] {
  const fromMatches = buildWinLossFromMatches(matches);
  if (fromMatches.size === 0) return players;

  return players.map((player) => {
    const derived = fromMatches.get(player.id);
    if (!derived) return player;

    const storedTotal = player.wins + player.losses;
    const derivedTotal = derived.wins + derived.losses;
    if (storedTotal >= derivedTotal) return player;

    return { ...player, wins: derived.wins, losses: derived.losses };
  });
}
