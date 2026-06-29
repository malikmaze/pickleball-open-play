import { SKILL_NUMERIC } from "@/lib/constants";
import {
  buildQueueUnits,
  getMutualPartner,
  orderQueueForPartners,
  pickFourFromQueueUnits,
} from "@/lib/player-partners";
import { getCompetitiveGenderTier } from "@/lib/player-gender";
import type { PlayerSkillLevel, PlayerStatus, ProfileGender, SkillMatchingMode } from "@/types";

export interface QueuePlayer {
  id: string;
  name: string;
  skillLevel: PlayerSkillLevel;
  gender?: ProfileGender;
  status: PlayerStatus;
  gamesPlayed: number;
  checkedInAt: string | null;
  lastPlayedAt: string | null;
  joinedAt: string;
  isActive: boolean;
  partnerId?: string | null;
}

export interface QueueSessionSettings {
  paymentRequired: boolean;
  allowUnpaidInQueue: boolean;
  skillMatchingMode?: SkillMatchingMode;
}

export interface BalancedTeams {
  teamA: [QueuePlayer, QueuePlayer];
  teamB: [QueuePlayer, QueuePlayer];
}

export interface NextMatchAssignment {
  players: QueuePlayer[];
  teams: BalancedTeams;
}

import { waitingSinceTimestamp } from "@/lib/queue/wait-time";

function skillValue(level: PlayerSkillLevel): number {
  return SKILL_NUMERIC[level];
}

function waitingSince(player: QueuePlayer): number {
  return waitingSinceTimestamp(player);
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

function averageSkill(players: QueuePlayer[]): number {
  return (
    players.reduce((sum, p) => sum + skillValue(p.skillLevel), 0) /
    players.length
  );
}

const QUEUE_STATUSES: PlayerStatus[] = ["Present", "Waiting"];

/** Players eligible for the court queue — checked in only, fair order, partners grouped. */
export function getEligiblePlayers(players: QueuePlayer[]): QueuePlayer[] {
  const eligible = players
    .filter((p) => p.isActive && QUEUE_STATUSES.includes(p.status))
    .sort(compareQueuePriority);
  return orderQueueForPartners(eligible);
}

function groupSkillSpread(players: QueuePlayer[]): number {
  const values = players.map((p) => skillValue(p.skillLevel));
  return Math.max(...values) - Math.min(...values);
}

export function selectNextFourPlayers(
  players: QueuePlayer[],
  settings: QueueSessionSettings
): QueuePlayer[] | null {
  const eligible = getEligiblePlayers(players);
  if (eligible.length < 4) return null;

  const mode = settings.skillMatchingMode ?? "Balanced";
  const units = buildQueueUnits(eligible);
  const picked = pickFourFromQueueUnits(units);

  if (!picked) return null;

  if (mode === "Strict" && groupSkillSpread(picked) > 2) {
    return null;
  }

  return picked;
}

function pairGenderPenalty(team: [QueuePlayer, QueuePlayer]): number {
  const tiers = team.map((p) => getCompetitiveGenderTier(p.gender));
  const maleTier = tiers.filter((t) => t === "male").length;
  const femaleTier = tiers.filter((t) => t === "female").length;
  if (maleTier === 1 && femaleTier === 1) return 0;
  if (tiers.every((t) => t === "unknown")) return 0;
  if (tiers.some((t) => t === "unknown")) return 0.5;
  return 1;
}

const TEAM_SPLITS: [[number, number], [number, number]][] = [
  [
    [0, 3],
    [1, 2],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 1],
    [2, 3],
  ],
];

function scoreTeamPartition(
  sorted: QueuePlayer[],
  teamAIdx: [number, number],
  teamBIdx: [number, number]
): number {
  const teamA: [QueuePlayer, QueuePlayer] = [
    sorted[teamAIdx[0]],
    sorted[teamAIdx[1]],
  ];
  const teamB: [QueuePlayer, QueuePlayer] = [
    sorted[teamBIdx[0]],
    sorted[teamBIdx[1]],
  ];
  const skillDiff = Math.abs(averageSkill(teamA) - averageSkill(teamB));
  const genderPenalty = pairGenderPenalty(teamA) + pairGenderPenalty(teamB);
  return skillDiff * 2 + genderPenalty;
}

function bestSkillGenderSplit(sorted: QueuePlayer[]): BalancedTeams {
  let best: BalancedTeams = {
    teamA: [sorted[0], sorted[3]],
    teamB: [sorted[1], sorted[2]],
  };
  let bestScore = Infinity;

  for (const [teamAIdx, teamBIdx] of TEAM_SPLITS) {
    const score = scoreTeamPartition(sorted, teamAIdx, teamBIdx);
    if (score < bestScore) {
      bestScore = score;
      best = {
        teamA: [sorted[teamAIdx[0]], sorted[teamAIdx[1]]],
        teamB: [sorted[teamBIdx[0]], sorted[teamBIdx[1]]],
      };
    }
  }

  return best;
}

function pairOthersWithPartner(
  partnerPair: [QueuePlayer, QueuePlayer],
  others: [QueuePlayer, QueuePlayer]
): BalancedTeams {
  const [o1, o2] = others;
  const options: BalancedTeams[] = [
    { teamA: partnerPair, teamB: [o1, o2] },
    { teamA: [partnerPair[0], o1], teamB: [partnerPair[1], o2] },
    { teamA: [partnerPair[0], o2], teamB: [partnerPair[1], o1] },
  ];

  let best = options[0];
  let bestScore = Infinity;
  for (const option of options) {
    const score =
      Math.abs(averageSkill(option.teamA) - averageSkill(option.teamB)) * 2 +
      pairGenderPenalty(option.teamA) +
      pairGenderPenalty(option.teamB);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

function pairTeamsFromPartners(players: QueuePlayer[]): BalancedTeams | null {
  const pairs: [QueuePlayer, QueuePlayer][] = [];
  const used = new Set<string>();

  for (const player of players) {
    if (used.has(player.id)) continue;
    const partner = getMutualPartner(player, players);
    if (!partner || used.has(partner.id)) continue;
    used.add(player.id);
    used.add(partner.id);
    pairs.push([player, partner]);
  }

  if (pairs.length === 2) {
    return { teamA: pairs[0], teamB: pairs[1] };
  }

  if (pairs.length === 1) {
    const others = players.filter((p) => !used.has(p.id));
    if (others.length !== 2) return null;
    return pairOthersWithPartner(pairs[0], [others[0], others[1]]);
  }

  return null;
}

export function balanceTeams(players: QueuePlayer[]): BalancedTeams {
  if (players.length !== 4) {
    throw new Error("balanceTeams requires exactly 4 players");
  }

  const partnerTeams = pairTeamsFromPartners(players);
  if (partnerTeams) return partnerTeams;

  const sorted = [...players].sort(
    (a, b) => skillValue(b.skillLevel) - skillValue(a.skillLevel)
  );

  return bestSkillGenderSplit(sorted);
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
  playerId: string
): number | null {
  const eligible = getEligiblePlayers(players);
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

export function previewNextMatch(
  players: QueuePlayer[],
  settings: QueueSessionSettings
): NextMatchAssignment | null {
  return createNextMatchForCourt(players, settings);
}

export function toQueuePlayer(player: {
  id: string;
  name: string;
  skillLevel: PlayerSkillLevel;
  gender?: ProfileGender;
  status: PlayerStatus;
  gamesPlayed: number;
  checkedInAt?: string;
  lastPlayedAt?: string;
  joinedAt: string;
  isActive: boolean;
  partnerId?: string | null;
}): QueuePlayer {
  return {
    id: player.id,
    name: player.name,
    skillLevel: player.skillLevel,
    gender: player.gender,
    status: player.status,
    gamesPlayed: player.gamesPlayed,
    checkedInAt: player.checkedInAt ?? null,
    lastPlayedAt: player.lastPlayedAt ?? null,
    joinedAt: player.joinedAt,
    isActive: player.isActive,
    partnerId: player.partnerId ?? null,
  };
}

export function formatTeamsPreview(assignment: NextMatchAssignment): string {
  const [a1, a2] = assignment.teams.teamA;
  const [b1, b2] = assignment.teams.teamB;
  return `A: ${a1.name} & ${a2.name} · B: ${b1.name} & ${b2.name}`;
}
