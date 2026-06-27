import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getTodayDate,
  mapSession,
  sortSessions,
  toSessionInsert,
  toSessionUpdate,
} from "@/lib/sessions";
import type { Database, PlayerRow } from "@/utils/supabase/database.types";
import type { Session, SessionStatus, SkillLevel } from "@/types";

type Client = SupabaseClient<Database>;

export async function fetchTodaySessions(
  supabase: Client
): Promise<Session[]> {
  const today = getTodayDate();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("date", today)
    .order("start_time", { ascending: true });

  if (sessionsError) throw sessionsError;
  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .in("session_id", sessionIds)
    .order("joined_at", { ascending: true });

  if (playersError) throw playersError;

  const playersBySession = new Map<string, PlayerRow[]>();
  for (const player of players ?? []) {
    const list = playersBySession.get(player.session_id) ?? [];
    list.push(player);
    playersBySession.set(player.session_id, list);
  }

  return sortSessions(
    sessions.map((row) =>
      mapSession(row, playersBySession.get(row.id) ?? [])
    )
  );
}

export async function fetchSessionById(
  supabase: Client,
  sessionId: string
): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!session) return null;

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", sessionId)
    .order("joined_at", { ascending: true });

  if (playersError) throw playersError;

  return mapSession(session, players ?? []);
}

export async function createSessionRecord(
  supabase: Client,
  session: Omit<Session, "id" | "status" | "players">
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert(toSessionInsert(session))
    .select()
    .single();

  if (error) throw error;
  return mapSession(data, []);
}

export async function updateSessionRecord(
  supabase: Client,
  sessionId: string,
  updates: Partial<Omit<Session, "id" | "players">>
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update(toSessionUpdate(updates))
    .eq("id", sessionId);

  if (error) throw error;
}

export async function deleteSessionRecord(
  supabase: Client,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw error;
}

export async function toggleSessionClosedRecord(
  supabase: Client,
  sessionId: string,
  currentStatus: SessionStatus
): Promise<SessionStatus> {
  const nextStatus: SessionStatus =
    currentStatus === "closed" ? "open" : "closed";

  const { error } = await supabase
    .from("sessions")
    .update({ status: nextStatus })
    .eq("id", sessionId);

  if (error) throw error;
  return nextStatus;
}

export async function clearSessionPlayersRecord(
  supabase: Client,
  sessionId: string
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("players")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) throw deleteError;

  const { error: updateError } = await supabase
    .from("sessions")
    .update({ status: "open" })
    .eq("id", sessionId);

  if (updateError) throw updateError;
}

export async function joinSessionRecord(
  supabase: Client,
  sessionId: string,
  player: {
    name: string;
    contactNumber?: string;
    skillLevel: SkillLevel;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("players")
    .insert({
      session_id: sessionId,
      name: player.name.trim(),
      contact_number: player.contactNumber?.trim() || null,
      skill_level: player.skillLevel,
    })
    .select("id")
    .single();

  if (error) throw error;

  const session = await fetchSessionById(supabase, sessionId);
  if (
    session &&
    session.players.length >= session.maxPlayers &&
    session.status !== "closed"
  ) {
    await supabase
      .from("sessions")
      .update({ status: "full" })
      .eq("id", sessionId);
  }

  return data.id;
}

export async function leaveSessionRecord(
  supabase: Client,
  playerId: string,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId);

  if (error) throw error;

  const session = await fetchSessionById(supabase, sessionId);
  if (
    session &&
    session.status === "full" &&
    session.players.length < session.maxPlayers
  ) {
    await supabase
      .from("sessions")
      .update({ status: "open" })
      .eq("id", sessionId);
  }
}

export async function deletePlayerRecord(
  supabase: Client,
  playerId: string
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId);

  if (error) throw error;
}
