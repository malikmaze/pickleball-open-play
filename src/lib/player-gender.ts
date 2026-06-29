import type { ProfileGender } from "@/types";

/** Court avatar / chip styling */
export type CourtVisualGender = "male" | "female" | "other";

/**
 * Team balancing tier — Others is grouped with male tier because in mixed open
 * play they typically compete at that level (not auto-paired as the "women's side").
 */
export type CompetitiveGenderTier = "male" | "female" | "unknown";

/** @deprecated Use CourtVisualGender */
export type PlayerGender = CourtVisualGender;

export function resolveCourtVisualGender(
  gender?: ProfileGender | string | null
): CourtVisualGender {
  if (gender === "Female") return "female";
  if (gender === "Male") return "male";
  return "other";
}

export function getCompetitiveGenderTier(
  gender?: ProfileGender | string | null
): CompetitiveGenderTier {
  if (gender === "Female") return "female";
  if (gender === "Male" || gender === "Others") return "male";
  // Legacy values before migration
  if (gender === "Woman") return "female";
  if (gender === "Man" || gender === "Non-binary") return "male";
  return "unknown";
}

/** Fallback when session player has no gender on file. */
export function guessCourtVisualGenderFromName(name: string): CourtVisualGender {
  const key = name.trim().toLowerCase().replace(/^test\s+/, "");
  const feminine = new Set([
    "mia",
    "jenna",
    "alexis",
    "sophie",
    "taylor",
    "chloe",
    "ruby",
    "maya",
    "tess",
    "stella",
    "daisy",
    "lily",
    "tessa",
    "skye",
    "nora",
    "zoe",
  ]);
  if (feminine.has(key)) return "female";
  return "other";
}

export function resolvePlayerCourtGender(
  gender?: ProfileGender | string | null,
  name?: string
): CourtVisualGender {
  if (gender) return resolveCourtVisualGender(gender);
  if (name) return guessCourtVisualGenderFromName(name);
  return "other";
}

/** @deprecated Use resolvePlayerCourtGender */
export function getPlayerGender(name: string): CourtVisualGender {
  return guessCourtVisualGenderFromName(name);
}
