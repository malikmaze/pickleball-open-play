import type { Player, PlayerStatus } from "@/types";

/** Payment collected — tracked via securedAt (independent of check-in). */
export function isPlayerPaid(player: Pick<Player, "securedAt">): boolean {
  return Boolean(player.securedAt);
}

export function canMarkPaid(status: PlayerStatus): boolean {
  return status !== "Waitlisted" && status !== "No Show";
}

export function paymentLabel(player: Pick<Player, "securedAt">): "Paid" | "Unpaid" {
  return isPlayerPaid(player) ? "Paid" : "Unpaid";
}
