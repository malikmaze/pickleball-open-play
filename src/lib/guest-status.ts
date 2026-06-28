import type { Player, PlayerStatus, Session } from "@/types";

export function findPlayerCourt(
  session: Session,
  playerId: string,
  matches: { courtId?: string; teamAPlayer1Id: string; teamAPlayer2Id: string; teamBPlayer1Id: string; teamBPlayer2Id: string; status: string }[],
  courts: { id: string; courtNumber: number }[]
): number | null {
  const active = matches.find(
    (m) =>
      (m.status === "ready" || m.status === "playing") &&
      [m.teamAPlayer1Id, m.teamAPlayer2Id, m.teamBPlayer1Id, m.teamBPlayer2Id].includes(
        playerId
      )
  );
  if (!active?.courtId) return null;
  return courts.find((c) => c.id === active.courtId)?.courtNumber ?? null;
}

export function getGuestStatusHint(
  player: Player,
  session: Session,
  queuePosition: number | null,
  waitlistPosition: number | null,
  courtNumber: number | null
): string | null {
  const status = player.status as PlayerStatus;

  if (status === "Waitlisted") {
    return waitlistPosition
      ? `You're #${waitlistPosition} on the waitlist. We'll add you automatically when a spot opens.`
      : "You're on the waitlist. We'll add you when a spot opens.";
  }
  if (status === "Registered") {
    if (session.paymentRequired) {
      return "You're joined. Complete payment, then check in with the organizer when you arrive.";
    }
    return "You're joined. Check in with the organizer when you arrive to enter the queue.";
  }
  if (status === "Secured") {
    return "Payment confirmed. Check in with the organizer when you arrive.";
  }
  if (status === "Present" || status === "Waiting") {
    if (queuePosition) {
      return `You're checked in. Queue position #${queuePosition} — courts fill in fair order.`;
    }
    return "You're checked in. Waiting for the organizer to add you to the queue.";
  }
  if (status === "Playing" && courtNumber) {
    return `You're on Court ${courtNumber} right now. Good luck!`;
  }
  if (status === "Playing") {
    return "You're on court right now.";
  }
  return null;
}
