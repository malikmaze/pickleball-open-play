import { MAX_SESSION_PLAYERS } from "@/lib/constants";

export const MIN_SESSION_PLAYERS = 4;

/** Strip non-digits and leading zeros while typing (e.g. 08 → 8, 0100 → 100). */
export function sanitizeIntegerTyping(raw: string, maxDigits: number): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/^0+/, "").slice(0, maxDigits);
}

export function parsePositiveInteger(
  raw: string,
  maxDigits: number
): number | null {
  const sanitized = sanitizeIntegerTyping(raw, maxDigits);
  if (sanitized === "") return null;
  const parsed = parseInt(sanitized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function clampInteger(
  value: number,
  min: number,
  max: number,
  fallback: number
): number {
  if (!Number.isFinite(value) || value < min) return fallback;
  return Math.min(max, value);
}

export function integerInputDisplay(value: number): string {
  return value > 0 ? String(value) : "";
}

/** Pull the first integer from legacy labels like "Court 1" or "Courts 1–3". */
export function parseCourtLabelToInteger(raw: string): number | null {
  const match = raw.trim().match(/\d+/);
  if (!match) return null;
  const parsed = parseInt(match[0], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatSessionCourtNumber(courtNumber: string): string {
  const n = parseCourtLabelToInteger(courtNumber);
  if (n != null) return `Court ${n}`;
  return courtNumber.trim() || "Court ?";
}

export function clampSessionCourtNumber(value: number, fallback = 1): number {
  return clampInteger(value, 1, 99, fallback);
}

export function clampSessionCourtCount(value: number, fallback = 1): number {
  return clampInteger(value, 1, 12, fallback);
}

export function clampTargetScore(value: number, fallback = 15): number {
  return clampInteger(value, 1, 99, fallback);
}

export function clampWinBy(value: number, fallback = 2): number {
  return clampInteger(value, 1, 20, fallback);
}

export function clampSideChangePoint(
  value: number,
  targetScore: number,
  fallback = 8
): number {
  const max = Math.max(1, targetScore - 1);
  return clampInteger(value, 1, max, Math.min(fallback, max));
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
  return parsePositiveInteger(raw, 3);
}

/** Match scores and other non-negative integers (0–99). */
export function sanitizeScoreTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  if (digits === "0") return "0";
  return digits.replace(/^0+/, "").slice(0, 2);
}

export function parseScoreInput(raw: string): number | null {
  const sanitized = sanitizeScoreTyping(raw);
  if (sanitized === "") return null;
  const parsed = parseInt(sanitized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Parse a live court score field; blank means 0 (shutout loser). */
export function parseCourtScoreField(raw: string): number {
  const parsed = parseScoreInput(raw);
  return parsed === null ? 0 : parsed;
}

/** Payment amounts — strip leading zeros on the whole part, keep decimals. */
export function sanitizeDecimalTyping(raw: string, maxDecimals = 2): string {
  let cleaned = raw.replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    const whole = cleaned.slice(0, dotIndex);
    const fraction = cleaned.slice(dotIndex + 1).replace(/\./g, "");
    const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || (fraction ? "0" : "");
    cleaned =
      normalizedWhole +
      (dotIndex < cleaned.length
        ? `.${fraction.slice(0, maxDecimals)}`
        : "");
  } else {
    cleaned = cleaned.replace(/^0+(?=\d)/, "");
  }
  return cleaned;
}

export function parsePaymentAmountInput(raw: string): number | null {
  const trimmed = sanitizeDecimalTyping(raw).trim();
  if (trimmed === "" || trimmed === ".") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function clampPaymentAmount(value: number, fallback = 0): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.round(value * 100) / 100;
}
