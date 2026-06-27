import type { PlayerSkillLevel, PlayerStatus, SessionSkillLevel } from "@/types";

export const PLAYER_SKILL_LEVELS: PlayerSkillLevel[] = [
  "Beginner",
  "Novice",
  "Intermediate Low",
  "Intermediate High",
  "Advanced",
];

export const SESSION_SKILL_LEVELS: SessionSkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Mixed",
];

/** @deprecated Use PLAYER_SKILL_LEVELS */
export const SKILL_LEVELS = SESSION_SKILL_LEVELS;

export const PLAYER_STATUSES: PlayerStatus[] = [
  "Registered",
  "Secured",
  "Present",
  "Waiting",
  "Playing",
  "Finished",
  "No Show",
];

export const SKILL_MATCHING_MODES = ["Strict", "Balanced", "Flexible"] as const;

export const APP_NAME = "Pickleball Open Play";
export const APP_TAGLINE = "Join games. Track slots. Play more.";

export const SKILL_NUMERIC: Record<PlayerSkillLevel, number> = {
  Beginner: 1,
  Novice: 2,
  "Intermediate Low": 3,
  "Intermediate High": 4,
  Advanced: 5,
};

export function normalizePlayerSkill(level: string): PlayerSkillLevel {
  if (level === "Intermediate") return "Intermediate Low";
  if (level === "Mixed") return "Novice";
  if (PLAYER_SKILL_LEVELS.includes(level as PlayerSkillLevel)) {
    return level as PlayerSkillLevel;
  }
  return "Novice";
}
