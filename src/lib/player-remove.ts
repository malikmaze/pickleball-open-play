import { isWalkInPlayer } from "@/lib/player-import";
import type { Player } from "@/types";

export type PlayerRemoveContext = "queue" | "checkin" | "booked" | "waitlist";

export type PlayerRemoveAction = "uncheck" | "delete";

export interface PlayerRemovePlan {
  action: PlayerRemoveAction;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

export function resolvePlayerRemove(
  player: Player,
  context: PlayerRemoveContext
): PlayerRemovePlan | { blockedReason: string } {
  if (player.status === "Playing") {
    return {
      blockedReason:
        "This player is on court. End or clear the match before removing them.",
    };
  }

  const walkIn = isWalkInPlayer(player);
  const inQueue = player.status === "Present" || player.status === "Waiting";
  const booked =
    player.status === "Registered" || player.status === "Secured";

  if (context === "queue") {
    if (!inQueue) {
      return { blockedReason: "This player is not in the queue." };
    }
    return {
      action: "uncheck",
      title: "Remove from queue?",
      description: `${player.name} will leave the queue and return to the check-in list. You can check them in again when ready.`,
      confirmLabel: "Move to check-in",
      destructive: false,
    };
  }

  if (context === "checkin") {
    if (walkIn) {
      return {
        action: "delete",
        title: "Remove walk-in from session?",
        description: `${player.name} was added on-site and has no advance booking. They will be removed from the session entirely.`,
        confirmLabel: "Remove from session",
        destructive: true,
      };
    }
    if (inQueue) {
      return {
        action: "uncheck",
        title: "Remove from queue?",
        description: `${player.name} will return to the booked list (awaiting check-in). Their booking stays on the session.`,
        confirmLabel: "Move to booked list",
        destructive: false,
      };
    }
    if (booked) {
      return {
        action: "delete",
        title: "Cancel booking?",
        description: `${player.name} will be removed from this session. A waitlisted player may be admitted if a spot opens.`,
        confirmLabel: "Cancel booking",
        destructive: true,
      };
    }
    return {
      blockedReason: "This player cannot be removed from check-in right now.",
    };
  }

  // booked (registrations) or waitlist
  return {
    action: "delete",
    title: walkIn ? "Remove walk-in from session?" : "Remove player?",
    description: walkIn
      ? `${player.name} was added on-site with no advance booking and will be removed from the session entirely.`
      : "This removes them from the session. Waitlisted players may be auto-admitted if a spot opens.",
    confirmLabel: walkIn ? "Remove from session" : "Remove",
    destructive: true,
  };
}

export interface BulkRemoveEntry {
  playerId: string;
  playerName: string;
  action: PlayerRemoveAction;
}

export interface BulkRemoveSummary {
  entries: BulkRemoveEntry[];
  blocked: { playerId: string; playerName: string; reason: string }[];
  uncheckCount: number;
  deleteCount: number;
  walkInDeleteCount: number;
}

export function summarizeBulkRemove(
  players: Player[],
  context: PlayerRemoveContext
): BulkRemoveSummary {
  const entries: BulkRemoveEntry[] = [];
  const blocked: BulkRemoveSummary["blocked"] = [];

  for (const player of players) {
    const plan = resolvePlayerRemove(player, context);
    if ("blockedReason" in plan) {
      blocked.push({
        playerId: player.id,
        playerName: player.name,
        reason: plan.blockedReason,
      });
    } else {
      entries.push({
        playerId: player.id,
        playerName: player.name,
        action: plan.action,
      });
    }
  }

  return {
    entries,
    blocked,
    uncheckCount: entries.filter((e) => e.action === "uncheck").length,
    deleteCount: entries.filter((e) => e.action === "delete").length,
    walkInDeleteCount: entries.filter(
      (e) =>
        e.action === "delete" &&
        isWalkInPlayer(players.find((p) => p.id === e.playerId)!)
    ).length,
  };
}

export function bulkRemoveDialogCopy(
  summary: BulkRemoveSummary,
  context: PlayerRemoveContext
): PlayerRemovePlan {
  const n = summary.entries.length;
  const parts: string[] = [];

  if (summary.uncheckCount > 0) {
    const dest =
      context === "queue"
        ? "check-in"
        : context === "checkin"
          ? "booked list"
          : "booked list";
    parts.push(
      `${summary.uncheckCount} → ${dest}`
    );
  }
  if (summary.deleteCount > 0) {
    parts.push(`${summary.deleteCount} removed from session`);
  }

  let description = parts.join(" · ");
  if (summary.walkInDeleteCount > 0) {
    description += ` Includes ${summary.walkInDeleteCount} walk-in${summary.walkInDeleteCount === 1 ? "" : "s"} with no advance booking.`;
  }
  if (summary.blocked.length > 0) {
    description += ` ${summary.blocked.length} skipped (on court or not eligible).`;
  }

  const destructive = summary.deleteCount > 0;

  return {
    action: summary.deleteCount > 0 ? "delete" : "uncheck",
    title: `Remove ${n} player${n === 1 ? "" : "s"}?`,
    description,
    confirmLabel: destructive ? `Remove ${n}` : `Move ${n}`,
    destructive,
  };
}

export function playerCanBulkSelect(
  player: Player,
  context: PlayerRemoveContext
): boolean {
  return !("blockedReason" in resolvePlayerRemove(player, context));
}
