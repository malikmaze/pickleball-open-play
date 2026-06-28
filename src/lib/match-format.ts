import type { Match, Player, Session } from "@/types";

export function playerName(
  players: Player[],
  playerId: string | null | undefined
): string {
  if (!playerId) return "—";
  return players.find((p) => p.id === playerId)?.name ?? "—";
}

export function formatTeamNames(
  players: Player[],
  id1: string | null | undefined,
  id2: string | null | undefined
): string {
  const a = playerName(players, id1);
  const b = playerName(players, id2);
  if (a === "—" && b === "—") return "—";
  if (a === "—") return b;
  if (b === "—") return a;
  return `${a} & ${b}`;
}

export function formatMatchScore(match: Match): string {
  const a = match.teamAScore ?? 0;
  const b = match.teamBScore ?? 0;
  return `${a}–${b}`;
}

export function formatMatchDuration(match: Match): string | null {
  if (!match.startedAt || !match.finishedAt) return null;
  const ms =
    new Date(match.finishedAt).getTime() - new Date(match.startedAt).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "<1 min";
  return `${mins} min`;
}

export function courtNumberForMatch(
  session: Session,
  courts: { id: string; courtNumber: number }[],
  match: Match
): number {
  const court = courts.find((c) => c.id === match.courtId);
  return court?.courtNumber ?? 0;
}
