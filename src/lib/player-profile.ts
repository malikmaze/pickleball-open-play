import type { PlayerProfile, PlayerSkillLevel, ProfileGender } from "@/types";
import { normalizeProfileGender } from "@/lib/constants";

const PROFILE_KEY = "sisclub-player-profile";
const JOINED_KEY = "sisclub-joined-players";

let cachedRaw: string | null | undefined;
let cachedProfile: PlayerProfile | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function invalidateProfileCache() {
  cachedRaw = undefined;
  cachedProfile = null;
}

export function getPlayerProfile(): PlayerProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (raw === cachedRaw) return cachedProfile;
    cachedRaw = raw;
    if (!raw) {
      cachedProfile = null;
      return cachedProfile;
    }
    const parsed = JSON.parse(raw) as PlayerProfile;
    cachedProfile = {
      ...parsed,
      gender: normalizeProfileGender(parsed.gender),
    };
    return cachedProfile;
  } catch {
    invalidateProfileCache();
    return null;
  }
}

export function savePlayerProfile(profile: {
  name: string;
  contactNumber?: string;
  gender?: ProfileGender;
  skillLevel: PlayerSkillLevel;
}): PlayerProfile {
  const saved: PlayerProfile = {
    id: getPlayerProfile()?.id ?? crypto.randomUUID(),
    name: profile.name.trim(),
    contactNumber: profile.contactNumber?.trim() || undefined,
    gender: profile.gender
      ? normalizeProfileGender(profile.gender)
      : undefined,
    skillLevel: profile.skillLevel,
  };

  if (isBrowser()) {
    const raw = JSON.stringify(saved);
    sessionStorage.setItem(PROFILE_KEY, raw);
    cachedRaw = raw;
    cachedProfile = saved;
    notifyProfileListeners();
  }

  return saved;
}

const profileListeners = new Set<() => void>();

function notifyProfileListeners() {
  profileListeners.forEach((listener) => listener());
}

export function subscribePlayerProfile(listener: () => void): () => void {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

export function getJoinedPlayerIds(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = sessionStorage.getItem(JOINED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function setJoinedPlayerId(
  sessionId: string,
  playerId: string
): void {
  if (!isBrowser()) return;
  const joined = getJoinedPlayerIds();
  joined[sessionId] = playerId;
  sessionStorage.setItem(JOINED_KEY, JSON.stringify(joined));
}

export function removeJoinedPlayerId(sessionId: string): void {
  if (!isBrowser()) return;
  const joined = getJoinedPlayerIds();
  delete joined[sessionId];
  sessionStorage.setItem(JOINED_KEY, JSON.stringify(joined));
}

export function getJoinedPlayerId(sessionId: string): string | undefined {
  return getJoinedPlayerIds()[sessionId];
}
