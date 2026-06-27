import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSessionFields,
  getTodayDate,
  mapActivity,
  mapCourt,
  mapMatch,
  mapSession,
  sortSessions,
  toSessionInsert,
  toSessionUpdate,
} from "@/lib/sessions";
import type { Database } from "@/utils/supabase/database.types";
import type {
  Court,
  Match,
  PlayerSkillLevel,
  PlayerStatus,
  Session,
  SessionActivity,
  SessionBundle,
  SessionSkillLevel,
  WinnerTeam,
} from "@/types";

type Client = SupabaseClient<Database>;

async function fetchPlayersForSessions(
  supabase: Client,
  sessionIds: string[]
) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .in("session_id", sessionIds)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodaySessions(
  supabase: Client
): Promise<Session[]> {
  const today = getTodayDate();
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("date", today)
    .order("start_time", { ascending: true });
  if (error) throw error;
  if (!sessions?.length) return [];

  const players = await fetchPlayersForSessions(
    supabase,
    sessions.map((s) => s.id)
  );
  const playersBySession = new Map<string, typeof players>();
  for (const player of players) {
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

export async function fetchSessionBundle(
  supabase: Client,
  sessionId: string
): Promise<SessionBundle | null> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session) return null;

  const { data: courts, error: courtsError } = await supabase
    .from("courts")
    .select("*")
    .eq("session_id", sessionId)
    .order("court_number", { ascending: true });
  if (courtsError) throw courtsError;

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  if (matchesError) throw matchesError;

  const { data: activity, error: activityError } = await supabase
    .from("session_activity")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (activityError) throw activityError;

  return {
    session,
    courts: (courts ?? []).map(mapCourt),
    matches: (matches ?? []).map(mapMatch),
    activity: (activity ?? []).map(mapActivity),
  };
}

export async function syncCourtsForSession(
  supabase: Client,
  sessionId: string,
  courtCount: number
): Promise<Court[]> {
  const { data: existing, error } = await supabase
    .from("courts")
    .select("*")
    .eq("session_id", sessionId)
    .order("court_number", { ascending: true });
  if (error) throw error;

  const current = existing ?? [];
  if (current.length < courtCount) {
    const toInsert = [];
    for (let n = current.length + 1; n <= courtCount; n++) {
      toInsert.push({
        session_id: sessionId,
        court_number: n,
        status: "Empty" as const,
      });
    }
    const { error: insertError } = await supabase
      .from("courts")
      .insert(toInsert);
    if (insertError) throw insertError;
  } else if (current.length > courtCount) {
    const toRemove = current.filter((c) => c.court_number > courtCount);
    for (const court of toRemove) {
      if (court.status === "Empty") {
        await supabase.from("courts").delete().eq("id", court.id);
      }
    }
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("courts")
    .select("*")
    .eq("session_id", sessionId)
    .order("court_number", { ascending: true });
  if (refreshError) throw refreshError;
  return (refreshed ?? []).map(mapCourt);
}

export async function createSessionRecord(
  supabase: Client,
  session: Omit<Session, "id" | "status" | "players">
): Promise<Session> {
  const defaults = defaultSessionFields();
  const { data, error } = await supabase
    .from("sessions")
    .insert(
      toSessionInsert({
        ...defaults,
        ...session,
      })
    )
    .select()
    .single();
  if (error) throw error;
  await syncCourtsForSession(supabase, data.id, data.court_count ?? 1);
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
  if (updates.courtCount !== undefined) {
    await syncCourtsForSession(supabase, sessionId, updates.courtCount);
  }
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
  currentStatus: Session["status"]
): Promise<Session["status"]> {
  const nextStatus = currentStatus === "closed" ? "open" : "closed";
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
  await supabase
    .from("sessions")
    .update({ status: "open" })
    .eq("id", sessionId);
}

export async function registerPlayerRecord(
  supabase: Client,
  sessionId: string,
  player: {
    name: string;
    contactNumber?: string;
    skillLevel: PlayerSkillLevel;
    note?: string;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("players")
    .insert({
      session_id: sessionId,
      name: player.name.trim(),
      contact_number: player.contactNumber?.trim() || null,
      skill_level: player.skillLevel,
      note: player.note?.trim() || null,
      status: "Registered",
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

/** @deprecated Use registerPlayerRecord */
export const joinSessionRecord = registerPlayerRecord;

export async function leaveSessionRecord(
  supabase: Client,
  playerId: string,
  sessionId: string
): Promise<void> {
  await deletePlayerRecord(supabase, playerId);
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
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw error;
}

export async function updatePlayerRecord(
  supabase: Client,
  playerId: string,
  updates: {
    status?: PlayerStatus;
    skillLevel?: PlayerSkillLevel;
    note?: string;
    isActive?: boolean;
    gamesPlayed?: number;
    checkedInAt?: string | null;
    securedAt?: string | null;
    lastPlayedAt?: string | null;
  }
): Promise<void> {
  const payload: Database["public"]["Tables"]["players"]["Update"] = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.skillLevel !== undefined)
    payload.skill_level = updates.skillLevel;
  if (updates.note !== undefined) payload.note = updates.note ?? null;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.gamesPlayed !== undefined)
    payload.games_played = updates.gamesPlayed;
  if (updates.checkedInAt !== undefined)
    payload.checked_in_at = updates.checkedInAt;
  if (updates.securedAt !== undefined) payload.secured_at = updates.securedAt;
  if (updates.lastPlayedAt !== undefined)
    payload.last_played_at = updates.lastPlayedAt;

  const { error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", playerId);
  if (error) throw error;
}

export async function markPlayerPresent(
  supabase: Client,
  playerId: string
): Promise<void> {
  await updatePlayerRecord(supabase, playerId, {
    status: "Present",
    checkedInAt: new Date().toISOString(),
  });
}

export async function markPlayerSecured(
  supabase: Client,
  playerId: string
): Promise<void> {
  await updatePlayerRecord(supabase, playerId, {
    status: "Secured",
    securedAt: new Date().toISOString(),
  });
}

export async function markPlayerNoShow(
  supabase: Client,
  playerId: string
): Promise<void> {
  await updatePlayerRecord(supabase, playerId, {
    status: "No Show",
    isActive: false,
  });
}

export async function updateCourtStatus(
  supabase: Client,
  courtId: string,
  status: Court["status"]
): Promise<void> {
  const { error } = await supabase
    .from("courts")
    .update({ status })
    .eq("id", courtId);
  if (error) throw error;
}

export async function createMatchRecord(
  supabase: Client,
  input: {
    sessionId: string;
    courtId: string;
    teamAPlayer1Id: string;
    teamAPlayer2Id: string;
    teamBPlayer1Id: string;
    teamBPlayer2Id: string;
  }
): Promise<Match> {
  const playerIds = [
    input.teamAPlayer1Id,
    input.teamAPlayer2Id,
    input.teamBPlayer1Id,
    input.teamBPlayer2Id,
  ];

  for (const id of playerIds) {
    await updatePlayerRecord(supabase, id, { status: "Playing" });
  }

  const { data, error } = await supabase
    .from("matches")
    .insert({
      session_id: input.sessionId,
      court_id: input.courtId,
      team_a_player_1: input.teamAPlayer1Id,
      team_a_player_2: input.teamAPlayer2Id,
      team_b_player_1: input.teamBPlayer1Id,
      team_b_player_2: input.teamBPlayer2Id,
      status: "ready",
    })
    .select()
    .single();
  if (error) throw error;

  await updateCourtStatus(supabase, input.courtId, "Ready");
  return mapMatch(data);
}

export async function startMatchRecord(
  supabase: Client,
  matchId: string,
  courtId: string
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({
      status: "playing",
      started_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (error) throw error;
  await updateCourtStatus(supabase, courtId, "Playing");
}

export async function finishMatchRecord(
  supabase: Client,
  matchId: string,
  courtId: string,
  teamAScore: number,
  teamBScore: number,
  winnerTeam: WinnerTeam,
  playerIds: string[]
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("matches")
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      winner_team: winnerTeam,
      status: "finished",
      finished_at: now,
    })
    .eq("id", matchId);
  if (error) throw error;

  for (const playerId of playerIds) {
    const { data: player } = await supabase
      .from("players")
      .select("games_played")
      .eq("id", playerId)
      .single();
    await updatePlayerRecord(supabase, playerId, {
      status: "Waiting",
      gamesPlayed: (player?.games_played ?? 0) + 1,
      lastPlayedAt: now,
    });
  }

  await updateCourtStatus(supabase, courtId, "Finished");
}

export async function resetCourtAfterMatch(
  supabase: Client,
  courtId: string
): Promise<void> {
  await updateCourtStatus(supabase, courtId, "Empty");
}

export async function getActiveMatchForCourt(
  supabase: Client,
  courtId: string
): Promise<Match | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("court_id", courtId)
    .in("status", ["ready", "playing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMatch(data) : null;
}

export async function updateMatchScoresRecord(
  supabase: Client,
  matchId: string,
  teamAScore: number,
  teamBScore: number
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
    })
    .eq("id", matchId);
  if (error) throw error;
}

export async function logSessionActivity(
  supabase: Client,
  sessionId: string,
  message: string,
  courtId?: string
): Promise<SessionActivity> {
  const { data, error } = await supabase
    .from("session_activity")
    .insert({
      session_id: sessionId,
      court_id: courtId ?? null,
      message,
    })
    .select()
    .single();
  if (error) throw error;
  return mapActivity(data);
}

export async function changeCourtSidesRecord(
  supabase: Client,
  court: Court,
  sessionId: string
): Promise<Court> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("courts")
    .update({
      sides_swapped: !court.sidesSwapped,
      side_change_count: court.sideChangeCount + 1,
      last_side_change_at: now,
    })
    .eq("id", court.id)
    .select()
    .single();
  if (error) throw error;
  await logSessionActivity(
    supabase,
    sessionId,
    `Court ${court.courtNumber} changed sides`,
    court.id
  );
  return mapCourt(data);
}

export async function clearCourtRecord(
  supabase: Client,
  courtId: string,
  sessionId: string,
  courtNumber: number,
  matchId?: string,
  playerIds?: string[]
): Promise<void> {
  if (matchId) {
    await supabase.from("matches").delete().eq("id", matchId);
  }
  if (playerIds?.length) {
    for (const playerId of playerIds) {
      await updatePlayerRecord(supabase, playerId, { status: "Waiting" });
    }
  }
  await updateCourtStatus(supabase, courtId, "Empty");
  await supabase
    .from("courts")
    .update({
      sides_swapped: false,
      side_change_count: 0,
      last_side_change_at: null,
    })
    .eq("id", courtId);
  await logSessionActivity(
    supabase,
    sessionId,
    `Court ${courtNumber} cleared`,
    courtId
  );
}

export async function addTestPlayersToSession(
  supabase: Client,
  sessionId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("add_test_players_to_session", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return data ?? 0;
}

export async function fetchTestPlayerTemplates(supabase: Client) {
  const { data, error } = await supabase
    .from("test_player_templates")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type { SessionSkillLevel };
