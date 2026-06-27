import { SKILL_NUMERIC } from "@/lib/constants";
import type { PlayerSkillLevel, PlayerStatus } from "@/types";

export interface QueuePlayer {
  id: string;
  name: string;
  skillLevel: PlayerSkillLevel;
  status: PlayerStatus;
  gamesPlayed: number;
  checkedInAt: string | null;
  joinedAt: string;
  isActive: boolean;
}

export interface QueueSessionSettings {
  paymentRequired: boolean;
  allowUnpaidInQueue: boolean;
}

export interface BalancedTeams {
  teamA: [QueuePlayer, QueuePlayer];
  teamB: [QueuePlayer, QueuePlayer];
}

export interface NextMatchAssignment {
  players: QueuePlayer[];
  teams: BalancedTeams;
}

const SKILL_COMPATIBILITY: Record<PlayerSkillLevel, PlayerSkillLevel[]> = {
  Beginner: ["Beginner", "Novice"],
  Novice: ["Beginner", "Novice", "Intermediate Low"],
  "Intermediate Low": ["Novice", "Intermediate Low", "Intermediate High"],
  "Intermediate High": ["Intermediate Low", "Intermediate High", "Advanced"],
  Advanced: ["Intermediate High", "Advanced"],
};

function skillValue(level: PlayerSkillLevel): number {
  return SKILL_NUMERIC[level];
}

function waitingSince(player: QueuePlayer): number {
  const ts = player.checkedInAt ?? player.joinedAt;
  return new Date(ts).getTime();
}

function queuePriority(player: QueuePlayer): [number, number] {
  return [player.gamesPlayed, waitingSince(player)];
}

function compareQueuePriority(a: QueuePlayer, b: QueuePlayer): number {
  const [aGames, aWait] = queuePriority(a);
  const [bGames, bWait] = queuePriority(b);
  if (aGames !== bGames) return aGames - bGames;
  return aWait - bWait;
}

function isSkillCompatible(a: PlayerSkillLevel, b: PlayerSkillLevel): boolean {
  return (
    SKILL_COMPATIBILITY[a].includes(b) || SKILL_COMPATIBILITY[b].includes(a)
  );
}

function averageSkill(players: QueuePlayer[]): number {
  return (
    players.reduce((sum, p) => sum + skillValue(p.skillLevel), 0) /
    players.length
  );
}

export function getEligiblePlayers(
  players: QueuePlayer[],
  settings: QueueSessionSettings
): QueuePlayer[] {
  const eligibleStatuses = ((): PlayerStatus[] => {
    if (settings.paymentRequired) {
      if (settings.allowUnpaidInQueue) {
        return ["Registered", "Secured", "Present", "Waiting"];
      }
      return ["Secured", "Present", "Waiting"];
    }
    return ["Present", "Waiting"];
  })();

  return players
    .filter(
      (p) =>
        p.isActive &&
        eligibleStatuses.includes(p.status) &&
        p.status !== "Playing"
    )
    .sort(compareQueuePriority);
}

function groupSkillSpread(players: QueuePlayer[]): number {
  const values = players.map((p) => skillValue(p.skillLevel));
  return Math.max(...values) - Math.min(...values);
}

function pickCompatibleFour(pool: QueuePlayer[]): QueuePlayer[] | null {
  if (pool.length < 4) return null;

  const sorted = [...pool].sort(compareQueuePriority);
  const anchor = sorted[0];
  const selected: QueuePlayer[] = [anchor];
  const remaining = sorted.slice(1);

  for (const candidate of remaining) {
    if (selected.length >= 4) break;
    const compatibleWithAll = selected.every((p) =>
      isSkillCompatible(p.skillLevel, candidate.skillLevel)
    );
    if (compatibleWithAll || selected.length >= 3) {
      selected.push(candidate);
    }
  }

  if (selected.length < 4) {
    for (const candidate of remaining) {
      if (selected.length >= 4) break;
      if (!selected.includes(candidate)) selected.push(candidate);
    }
  }

  return selected.length === 4 ? selected : null;
}

export function selectNextFourPlayers(
  players: QueuePlayer[],
  settings: QueueSessionSettings
): QueuePlayer[] | null {
  const eligible = getEligiblePlayers(players, settings);
  if (eligible.length < 4) return null;

  const ideal = pickCompatibleFour(eligible);
  if (ideal) return ideal;

  const fallback = eligible.slice(0, 4);
  if (groupSkillSpread(fallback) > 3) {
    const mixed = [...eligible].sort((a, b) => {
      const spreadA = groupSkillSpread([eligible[0], a, b, eligible[3]]);
      return spreadA;
    });
    return mixed.slice(0, 4);
  }

  return fallback;
}

export function balanceTeams(players: QueuePlayer[]): BalancedTeams {
  if (players.length !== 4) {
    throw new Error("balanceTeams requires exactly 4 players");
  }

  const sorted = [...players].sort(
    (a, b) => skillValue(b.skillLevel) - skillValue(a.skillLevel)
  );

  const teamA: [QueuePlayer, QueuePlayer] = [sorted[0], sorted[3]];
  const teamB: [QueuePlayer, QueuePlayer] = [sorted[1], sorted[2]];

  const teamAAvg = averageSkill(teamA);
  const teamBAvg = averageSkill(teamB);

  if (Math.abs(teamAAvg - teamBAvg) > 1.5) {
    return {
      teamA: [sorted[0], sorted[2]],
      teamB: [sorted[1], sorted[3]],
    };
  }

  return { teamA, teamB };
}

export function createNextMatchForCourt(
  players: QueuePlayer[],
  settings: QueueSessionSettings
): NextMatchAssignment | null {
  const selected = selectNextFourPlayers(players, settings);
  if (!selected) return null;
  return {
    players: selected,
    teams: balanceTeams(selected),
  };
}

export function getQueuePosition(
  players: QueuePlayer[],
  playerId: string,
  settings: QueueSessionSettings
): number | null {
  const eligible = getEligiblePlayers(players, settings);
  const index = eligible.findIndex((p) => p.id === playerId);
  return index === -1 ? null : index + 1;
}

export function validateMatchScore(
  teamAScore: number,
  teamBScore: number,
  targetScore: number,
  winBy: number
): { valid: boolean; winner?: "A" | "B"; error?: string } {
  if (teamAScore < 0 || teamBScore < 0) {
    return { valid: false, error: "Scores cannot be negative" };
  }

  const max = Math.max(teamAScore, teamBScore);
  const min = Math.min(teamAScore, teamBScore);
  const diff = max - min;

  if (max < targetScore) {
    return { valid: false, error: `Winner must reach at least ${targetScore}` };
  }

  if (max === targetScore && diff >= winBy) {
    return { valid: true, winner: teamAScore > teamBScore ? "A" : "B" };
  }

  if (max > targetScore && diff === winBy) {
    return { valid: true, winner: teamAScore > teamBScore ? "A" : "B" };
  }

  return {
    valid: false,
    error: `Must win by ${winBy} once target score is reached`,
  };
}

export function toQueuePlayer(player: {
  id: string;
  name: string;
  skillLevel: PlayerSkillLevel;
  status: PlayerStatus;
  gamesPlayed: number;
  checkedInAt?: string;
  joinedAt: string;
  isActive: boolean;
}): QueuePlayer {
  return {
    id: player.id,
    name: player.name,
    skillLevel: player.skillLevel,
    status: player.status,
    gamesPlayed: player.gamesPlayed,
    checkedInAt: player.checkedInAt ?? null,
    joinedAt: player.joinedAt,
    isActive: player.isActive,
  };
}
