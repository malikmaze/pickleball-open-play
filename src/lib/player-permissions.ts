import type { PlayerStatus } from "@/types";

/** Player may leave before check-in (Present), including waitlist. */
export const PLAYER_SELF_WITHDRAW_STATUSES: PlayerStatus[] = [
  "Registered",
  "Waitlisted",
  "Secured",
];

export function canPlayerWithdrawRegistration(
  status: PlayerStatus
): boolean {
  return PLAYER_SELF_WITHDRAW_STATUSES.includes(status);
}
