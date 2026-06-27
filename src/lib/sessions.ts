import type {
  Database,
  PlayerRow,
  SessionRow,
} from "@/utils/supabase/database.types";
import type { Player, Session, SessionStatus, SkillLevel } from "@/types";

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function computeSessionStatus(
  status: string,
  playerCount: number,
  maxPlayers: number
): SessionStatus {
  if (status === "closed") return "closed";
  if (playerCount >= maxPlayers) return "full";
  return "open";
}

export function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contact_number ?? undefined,
    skillLevel: row.skill_level as SkillLevel,
    joinedAt: row.joined_at,
  };
}

export function mapSession(
  row: SessionRow,
  players: PlayerRow[] = []
): Session {
  const mappedPlayers = players.map(mapPlayer);
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    location: row.location,
    courtNumber: row.court_number,
    skillLevel: row.skill_level as SkillLevel,
    maxPlayers: row.max_players,
    status: computeSessionStatus(
      row.status,
      mappedPlayers.length,
      row.max_players
    ),
    players: mappedPlayers,
  };
}

export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

export function toSessionInsert(
  data: Omit<Session, "id" | "status" | "players">
): Database["public"]["Tables"]["sessions"]["Insert"] {
  return {
    title: data.title,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    location: data.location,
    court_number: data.courtNumber,
    skill_level: data.skillLevel,
    max_players: data.maxPlayers,
    status: "open",
  };
}

export function toSessionUpdate(
  data: Partial<Omit<Session, "id" | "players">>
): Database["public"]["Tables"]["sessions"]["Update"] {
  const update: Database["public"]["Tables"]["sessions"]["Update"] = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.date !== undefined) update.date = data.date;
  if (data.startTime !== undefined) update.start_time = data.startTime;
  if (data.endTime !== undefined) update.end_time = data.endTime;
  if (data.location !== undefined) update.location = data.location;
  if (data.courtNumber !== undefined) update.court_number = data.courtNumber;
  if (data.skillLevel !== undefined) update.skill_level = data.skillLevel;
  if (data.maxPlayers !== undefined) update.max_players = data.maxPlayers;
  if (data.status !== undefined) update.status = data.status;
  return update;
}
