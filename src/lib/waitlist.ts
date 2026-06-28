import type { Player, PlayerStatus } from "@/types";

/** Statuses that occupy a session spot (not waitlist overflow). */
export const ADMITTED_PLAYER_STATUSES: PlayerStatus[] = [
  "Registered",
  "Secured",
  "Present",
  "Waiting",
  "Playing",
];

export function isAdmittedPlayer(status: PlayerStatus): boolean {
  return ADMITTED_PLAYER_STATUSES.includes(status);
}

export function countAdmittedPlayers(
  players: Pick<Player, "status">[]
): number {
  return players.filter((p) => isAdmittedPlayer(p.status)).length;
}

export function getWaitlistedPlayers(players: Player[]): Player[] {
  return players
    .filter((p) => p.status === "Waitlisted")
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export function getWaitlistPosition(
  players: Player[],
  playerId: string
): number | null {
  const waitlisted = getWaitlistedPlayers(players);
  const index = waitlisted.findIndex((p) => p.id === playerId);
  return index >= 0 ? index + 1 : null;
}

export function getAvailableSpots(
  admittedCount: number,
  maxPlayers: number
): number {
  return Math.max(0, maxPlayers - admittedCount);
}
