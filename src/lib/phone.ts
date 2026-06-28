/** Philippine mobile: 09XX XXX XXXX (11 digits) or +63 9XX XXX XXXX */
const PH_LOCAL_MOBILE = /^09\d{9}$/;

export const PH_MOBILE_PLACEHOLDER = "09XX XXX XXXX";
export const PH_MOBILE_ERROR =
  "Enter a valid Philippine mobile number (e.g. 09XX XXX XXXX)";

/** Strip formatting characters; keep digits and leading + only. */
export function sanitizeContactInput(raw: string): string {
  return raw.replace(/[^\d+\s\-()]/g, "");
}

/** Normalize to local 09XXXXXXXXX for storage and lookup. */
export function normalizePhilippineMobile(input: string): string {
  let digits = input.replace(/[\s\-().]/g, "");

  if (digits.startsWith("+63")) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.startsWith("63") && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  }

  return digits;
}

export function isValidPhilippineMobile(input: string): boolean {
  const normalized = normalizePhilippineMobile(input.trim());
  return PH_LOCAL_MOBILE.test(normalized);
}

/** Returns normalized 09XXXXXXXXX or null if invalid. */
export function parsePhilippineMobile(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = normalizePhilippineMobile(trimmed);
  return PH_LOCAL_MOBILE.test(normalized) ? normalized : null;
}

export function getPhilippineMobileError(input: string): string | null {
  if (!input.trim()) return "Please enter your contact number";
  if (!isValidPhilippineMobile(input)) return PH_MOBILE_ERROR;
  return null;
}
