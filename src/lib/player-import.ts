import { PLAYER_SKILL_LEVELS } from "@/lib/constants";
import type { PlayerSkillLevel } from "@/types";

export const BULK_IMPORT_SOURCE_NOTE = "Bulk import";
export const WALK_IN_SOURCE_NOTE = "Walk-in";

export function playerNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function findExistingPlayerByName(
  players: { id: string; name: string; status: string }[],
  name: string
): { id: string; name: string; status: string } | null {
  const key = playerNameKey(name);
  if (!key) return null;
  return players.find((p) => playerNameKey(p.name) === key) ?? null;
}

export interface ParsedImportPlayer {
  name: string;
  contactNumber?: string;
  skillLevel?: PlayerSkillLevel;
}

function parseSkillToken(value: string): PlayerSkillLevel | undefined {
  const normalized = value.trim();
  if ((PLAYER_SKILL_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as PlayerSkillLevel;
  }
  const lower = normalized.toLowerCase();
  if (lower === "newbie" || lower === "first timer" || lower === "first-timer") {
    return "Newbie";
  }
  return undefined;
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

/** Parse pasted lines from a booking list or spreadsheet (one player per line). */
export function parsePlayerImportLines(text: string): ParsedImportPlayer[] {
  const results: ParsedImportPlayer[] = [];

  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split(/[,|\t]/).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    const name = parts[0];
    let contactNumber: string | undefined;
    let skillLevel: PlayerSkillLevel | undefined;

    for (const part of parts.slice(1)) {
      const skill = parseSkillToken(part);
      if (skill) {
        skillLevel = skill;
        continue;
      }
      if (looksLikePhone(part)) {
        contactNumber = part;
      }
    }

    results.push({ name, contactNumber, skillLevel });
  }

  return results;
}

export function mergeImportNote(
  existing?: string,
  source?: string
): string | undefined {
  const trimmed = existing?.trim();
  if (!source) return trimmed || undefined;
  if (!trimmed) return source;
  if (trimmed.toLowerCase().includes(source.toLowerCase())) return trimmed;
  return `${source} · ${trimmed}`;
}

export function isWalkInPlayer(player: { note?: string | null }): boolean {
  const note = player.note?.toLowerCase() ?? "";
  return note.includes(WALK_IN_SOURCE_NOTE.toLowerCase());
}
