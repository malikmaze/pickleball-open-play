import type { Player } from "@/types";
import type { QueuePlayer } from "@/lib/queue/queue-engine";

export function waitingSinceTimestamp(player: {
  checkedInAt?: string | null;
  lastPlayedAt?: string | null;
  joinedAt: string;
}): number {
  if (player.lastPlayedAt) {
    return new Date(player.lastPlayedAt).getTime();
  }
  if (player.checkedInAt) {
    return new Date(player.checkedInAt).getTime();
  }
  return new Date(player.joinedAt).getTime();
}

export function formatWaitingTime(player: {
  checkedInAt?: string | null;
  lastPlayedAt?: string | null;
  joinedAt: string;
}): string {
  const ms = Date.now() - waitingSinceTimestamp(player);
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function playerToQueueWaitFields(player: Player): Pick<
  QueuePlayer,
  "checkedInAt" | "joinedAt"
> & { lastPlayedAt?: string | null } {
  return {
    checkedInAt: player.checkedInAt ?? null,
    joinedAt: player.joinedAt,
    lastPlayedAt: player.lastPlayedAt ?? null,
  };
}
