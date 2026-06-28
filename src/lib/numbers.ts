import { MAX_SESSION_PLAYERS } from "@/lib/constants";

export const MIN_SESSION_PLAYERS = 4;

/** Strip non-digits and leading zeros while typing (e.g. 08 → 8, 0100 → 100). */
export function sanitizeIntegerTyping(raw: string, maxDigits: number): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/^0+/, "").slice(0, maxDigits);
}

export function clampSessionMaxPlayers(
  value: number,
  fallback = 8
): number {
  if (!Number.isFinite(value) || value < MIN_SESSION_PLAYERS) {
    return fallback;
  }
  return Math.min(MAX_SESSION_PLAYERS, value);
}

export function parseSessionMaxPlayersInput(raw: string): number | null {
  const sanitized = sanitizeIntegerTyping(raw, 3);
  if (sanitized === "") return null;
  const parsed = parseInt(sanitized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
