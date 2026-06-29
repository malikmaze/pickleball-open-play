import type {
  PlayerSkillLevel,
  PlayerStatus,
  ProfileGender,
  SessionSkillLevel,
} from "@/types";

export const PLAYER_SKILL_LEVELS: PlayerSkillLevel[] = [
  "Newbie",
  "Beginner",
  "Novice",
  "Intermediate Low",
  "Intermediate High",
  "Advanced",
];

/** Short copy for join/profile skill pickers. */
export const PLAYER_SKILL_DESCRIPTIONS: Record<PlayerSkillLevel, string> = {
  Newbie:
    "First time — no racket sport experience, still learning to hit the ball.",
  Beginner: "Some pickleball or racket sport experience, basic rallies.",
  Novice: "Comfortable with rules and can sustain short rallies.",
  "Intermediate Low": "Consistent play, working on strategy and placement.",
  "Intermediate High": "Strong rallies, competitive open play.",
  Advanced: "Tournament-level or very experienced competitive player.",
};

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
  "Waitlisted",
  "Secured",
  "Present",
  "Waiting",
  "Playing",
  "Finished",
  "No Show",
];

export const PROFILE_GENDERS = [
  "Male",
  "Female",
  "Others",
] as const satisfies readonly ProfileGender[];

export const DEFAULT_PROFILE_GENDER: ProfileGender = "Others";

export function normalizeProfileGender(value?: string | null): ProfileGender {
  if (!value) return DEFAULT_PROFILE_GENDER;
  if (value === "Male" || value === "Female" || value === "Others") {
    return value;
  }
  if (value === "Man" || value === "Woman") {
    return value === "Man" ? "Male" : "Female";
  }
  if (value === "Non-binary" || value === "Prefer not to say") {
    return "Others";
  }
  return DEFAULT_PROFILE_GENDER;
}

export const SKILL_MATCHING_MODES = ["Strict", "Balanced", "Flexible"] as const;

export const APP_NAME = "Pickleball Open Play";
export const APP_TAGLINE = "Join games. Track slots. Play more.";

export const MAX_SESSION_PLAYERS = 100;
export const FREE_SESSION_PAYMENT_NOTE = "Free to join — no payment required.";

export const SKILL_NUMERIC: Record<PlayerSkillLevel, number> = {
  Newbie: 0,
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
