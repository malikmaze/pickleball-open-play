import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSessionFields,
  computeSessionStatus,
  getTodayDate,
  mapActivity,
  mapActivityLog,
  mapCourt,
  mapMatch,
  mapProfile,
  mapSession,
  sortSessions,
  toSessionInsert,
  toSessionUpdate,
  getQueueSessionSettings,
} from "@/lib/sessions";
import {
  type CourtScheduleEntry,
  isCourtRentalActive,
} from "@/lib/court-schedule";
import {
  normalizePhilippineMobile,
  parsePhilippineMobile,
  PH_MOBILE_ERROR,
} from "@/lib/phone";
import {
  createNextMatchForCourt,
  toQueuePlayer,
  type QueueSessionSettings,
} from "@/lib/queue/queue-engine";
import {
  countAdmittedPlayers,
  getAvailableSpots,
  getWaitlistedPlayers,
} from "@/lib/waitlist";
import type { Database } from "@/utils/supabase/database.types";
import type { Json } from "@/utils/supabase/database.types";
import type {
  ActivityEventType,
  Court,
  Match,
  PlayerSkillLevel,
  PlayerStatus,
  ProfileGender,
  Session,
  SessionActivity,
  SessionBundle,
  SessionSkillLevel,
  UserProfile,
  WinnerTeam,
} from "@/types";

type Client = SupabaseClient<Database>;

export type SessionListScope = "today" | "upcoming" | "all";

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

async function mapSessionRows(
  supabase: Client,
  rows: Database["public"]["Tables"]["sessions"]["Row"][]
): Promise<Session[]> {
  if (!rows.length) return [];

  const players = await fetchPlayersForSessions(
    supabase,
    rows.map((s) => s.id)
  );
  const playersBySession = new Map<string, typeof players>();
  for (const player of players) {
    const list = playersBySession.get(player.session_id) ?? [];
    list.push(player);
    playersBySession.set(player.session_id, list);
  }

  return sortSessions(
    rows.map((row) => mapSession(row, playersBySession.get(row.id) ?? []))
  );
}

export async function fetchSessions(
  supabase: Client,
  scope: SessionListScope = "today"
): Promise<Session[]> {
  const today = getTodayDate();
  let query = supabase.from("sessions").select("*");

  if (scope === "today") {
    query = query.eq("date", today);
  } else if (scope === "upcoming") {
    query = query.gte("date", today);
  }

  const { data: sessions, error } = await query
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  if (!sessions?.length) return [];

  return mapSessionRows(supabase, sessions);
}

export async function fetchTodaySessions(
  supabase: Client
): Promise<Session[]> {
  return fetchSessions(supabase, "today");
}

export async function fetchUpcomingSessions(
  supabase: Client
): Promise<Session[]> {
  return fetchSessions(supabase, "upcoming");
}

export async function fetchAllSessions(
  supabase: Client
): Promise<Session[]> {
  return fetchSessions(supabase, "all");
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

  const { data: activityLogs, error: logsError } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (logsError) throw logsError;

  return {
    session,
    courts: (courts ?? []).map(mapCourt),
    matches: (matches ?? []).map(mapMatch),
    activity: (activity ?? []).map(mapActivity),
    activityLogs: (activityLogs ?? []).map(mapActivityLog),
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

export async function syncCourtRentalTimes(
  supabase: Client,
  sessionId: string,
  courtSchedules: CourtScheduleEntry[] | null
): Promise<void> {
  const { data: courts, error } = await supabase
    .from("courts")
    .select("id, court_number")
    .eq("session_id", sessionId)
    .order("court_number", { ascending: true });
  if (error) throw error;

  for (const court of courts ?? []) {
    const schedule = courtSchedules?.find(
      (entry) => entry.courtNumber === court.court_number
    );
    const payload =
      courtSchedules === null
        ? {
            rental_start_time: null,
            rental_end_time: null,
          }
        : schedule
          ? {
              rental_start_time: schedule.startTime,
              rental_end_time: schedule.endTime,
            }
          : {
              rental_start_time: null,
              rental_end_time: null,
            };

    const { error: updateError } = await supabase
      .from("courts")
      .update(payload)
      .eq("id", court.id);
    if (updateError) throw updateError;
  }
}

export async function createSessionRecord(
  supabase: Client,
  session: Omit<Session, "id" | "status" | "players">,
  courtSchedules?: CourtScheduleEntry[] | null
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
  if (courtSchedules !== undefined) {
    await syncCourtRentalTimes(supabase, data.id, courtSchedules);
  }
  return mapSession(data, []);
}

export async function updateSessionRecord(
  supabase: Client,
  sessionId: string,
  updates: Partial<Omit<Session, "id" | "players">>,
  courtSchedules?: CourtScheduleEntry[] | null
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update(toSessionUpdate(updates))
    .eq("id", sessionId);
  if (error) throw error;
  if (updates.courtCount !== undefined) {
    await syncCourtsForSession(supabase, sessionId, updates.courtCount);
  }
  if (updates.maxPlayers !== undefined) {
    await processWaitlistPromotions(supabase, sessionId);
  }
  if (courtSchedules !== undefined) {
    await syncCourtRentalTimes(supabase, sessionId, courtSchedules);
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

export async function syncSessionCapacityRecord(
  supabase: Client,
  sessionId: string
): Promise<void> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session || session.status === "closed") return;

  const admittedCount = countAdmittedPlayers(session.players);
  const dbStatus = computeSessionStatus(
    "open",
    admittedCount,
    session.maxPlayers
  );

  await supabase
    .from("sessions")
    .update({ status: dbStatus })
    .eq("id", sessionId);
}

export async function processWaitlistPromotions(
  supabase: Client,
  sessionId: string
): Promise<number> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session || session.status === "closed") return 0;

  let spots = getAvailableSpots(
    countAdmittedPlayers(session.players),
    session.maxPlayers
  );
  if (spots <= 0) {
    await syncSessionCapacityRecord(supabase, sessionId);
    return 0;
  }

  const waitlisted = getWaitlistedPlayers(session.players);
  let promoted = 0;

  for (const player of waitlisted) {
    if (spots <= 0) break;
    const { error } = await supabase
      .from("players")
      .update({ status: "Registered" })
      .eq("id", player.id)
      .eq("status", "Waitlisted");
    if (error) throw error;
    spots -= 1;
    promoted += 1;
  }

  await syncSessionCapacityRecord(supabase, sessionId);
  return promoted;
}

export async function admitWaitlistedPlayerRecord(
  supabase: Client,
  sessionId: string,
  playerId: string
): Promise<void> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session) throw new Error("Session not found");

  const player = session.players.find((p) => p.id === playerId);
  if (!player || player.status !== "Waitlisted") {
    throw new Error("Player is not on the waitlist");
  }

  const admittedCount = countAdmittedPlayers(session.players);
  if (admittedCount >= session.maxPlayers) {
    throw new Error("Session is at capacity");
  }

  const { error } = await supabase
    .from("players")
    .update({ status: "Registered" })
    .eq("id", playerId)
    .eq("status", "Waitlisted");
  if (error) throw error;

  await syncSessionCapacityRecord(supabase, sessionId);
}

export async function registerPlayerRecord(
  supabase: Client,
  sessionId: string,
  player: {
    userId?: string;
    name: string;
    contactNumber?: string;
    gender?: ProfileGender;
    skillLevel: PlayerSkillLevel;
    note?: string;
  }
): Promise<{ playerId: string; waitlisted: boolean }> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "closed") throw new Error("This session is closed");

  const admittedCount = countAdmittedPlayers(session.players);
  const waitlisted = admittedCount >= session.maxPlayers;
  const status: PlayerStatus = waitlisted ? "Waitlisted" : "Registered";

  const contactStored = player.contactNumber?.trim()
    ? parsePhilippineMobile(player.contactNumber)
    : null;
  if (player.contactNumber?.trim() && !contactStored) {
    throw new Error(PH_MOBILE_ERROR);
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      session_id: sessionId,
      user_id: player.userId ?? null,
      name: player.name.trim(),
      contact_number: contactStored,
      gender: player.gender ?? null,
      skill_level: player.skillLevel,
      note: player.note?.trim() || null,
      status,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await syncSessionCapacityRecord(supabase, sessionId);
  return { playerId: data.id, waitlisted };
}

/** @deprecated Use registerPlayerRecord */
export const joinSessionRecord = registerPlayerRecord;

export interface AdminAddPlayerOptions {
  /** Check in on add — Present status, enters queue when admitted. */
  checkIn?: boolean;
  /** Payment collected — sets securedAt (independent of session payment settings). */
  paymentConfirmed?: boolean;
}

export async function adminAddPlayerRecord(
  supabase: Client,
  sessionId: string,
  player: {
    name: string;
    contactNumber?: string;
    gender?: ProfileGender;
    skillLevel: PlayerSkillLevel;
    note?: string;
  },
  options: AdminAddPlayerOptions = {}
): Promise<{ playerId: string; waitlisted: boolean; status: PlayerStatus }> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "closed") throw new Error("This session is closed");

  const admittedCount = countAdmittedPlayers(session.players);
  const waitlisted = admittedCount >= session.maxPlayers;

  const contactStored = player.contactNumber?.trim()
    ? parsePhilippineMobile(player.contactNumber)
    : null;
  if (player.contactNumber?.trim() && !contactStored) {
    throw new Error(PH_MOBILE_ERROR);
  }

  const now = new Date().toISOString();
  const paid = Boolean(options.paymentConfirmed);
  let status: PlayerStatus = waitlisted ? "Waitlisted" : "Registered";

  if (!waitlisted) {
    if (options.checkIn) {
      status = "Present";
    } else if (paid) {
      status = "Secured";
    }
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      session_id: sessionId,
      name: player.name.trim(),
      contact_number: contactStored,
      gender: player.gender ?? null,
      skill_level: player.skillLevel,
      note: player.note?.trim() || null,
      status,
      checked_in_at: status === "Present" ? now : null,
      secured_at: paid ? now : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (status === "Present") {
    await logActivity(
      supabase,
      sessionId,
      "check_in",
      player.name.trim(),
      "Checked In"
    );
  } else if (status === "Secured") {
    await logActivity(
      supabase,
      sessionId,
      "payment_confirmed",
      player.name.trim(),
      "Payment Confirmed"
    );
  }

  await syncSessionCapacityRecord(supabase, sessionId);
  return { playerId: data.id, waitlisted, status };
}

export async function importPlayersRecord(
  supabase: Client,
  sessionId: string,
  players: {
    name: string;
    contactNumber?: string;
    skillLevel: PlayerSkillLevel;
    note?: string;
  }[],
  options: AdminAddPlayerOptions = {}
): Promise<{
  added: number;
  waitlisted: number;
  checkedIn: number;
  skipped: number;
  errors: string[];
}> {
  const session = await fetchSessionById(supabase, sessionId);
  if (!session) throw new Error("Session not found");

  const existingNames = new Set(
    session.players.map((p) => p.name.trim().toLowerCase())
  );

  let added = 0;
  let waitlisted = 0;
  let checkedIn = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of players) {
    const name = row.name.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (existingNames.has(key)) {
      skipped++;
      continue;
    }

    try {
      const result = await adminAddPlayerRecord(supabase, sessionId, row, options);
      existingNames.add(key);
      added++;
      if (result.waitlisted) waitlisted++;
      if (result.status === "Present") checkedIn++;
    } catch (err) {
      errors.push(
        `${name}: ${err instanceof Error ? err.message : "Failed to add"}`
      );
    }
  }

  return { added, waitlisted, checkedIn, skipped, errors };
}

export async function findPlayerByContactInSession(
  supabase: Client,
  sessionId: string,
  contactNumber: string
): Promise<string | null> {
  const normalized = parsePhilippineMobile(contactNumber);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("players")
    .select("id, contact_number")
    .eq("session_id", sessionId)
    .neq("status", "No Show")
    .order("joined_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return null;

  const match = data.find(
    (row) =>
      row.contact_number &&
      normalizePhilippineMobile(row.contact_number) === normalized
  );

  return match?.id ?? null;
}

export async function leaveSessionRecord(
  supabase: Client,
  playerId: string,
  sessionId: string
): Promise<void> {
  await deletePlayerRecord(supabase, playerId);
  await processWaitlistPromotions(supabase, sessionId);
}

export async function deletePlayerRecord(
  supabase: Client,
  playerId: string
): Promise<void> {
  await supabase
    .from("players")
    .update({ partner_id: null })
    .eq("partner_id", playerId);

  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw error;
}

export async function updatePlayerRecord(
  supabase: Client,
  playerId: string,
  updates: {
    status?: PlayerStatus;
    skillLevel?: PlayerSkillLevel;
    gender?: ProfileGender | null;
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
  if (updates.gender !== undefined) payload.gender = updates.gender;
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

export async function setPlayerPartnerRecord(
  supabase: Client,
  sessionId: string,
  playerId: string,
  partnerId: string | null
): Promise<void> {
  if (partnerId === playerId) {
    throw new Error("A player cannot partner with themselves");
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, session_id, partner_id")
    .eq("id", playerId)
    .single();
  if (playerError) throw playerError;
  if (!player || player.session_id !== sessionId) {
    throw new Error("Player not found in this session");
  }

  const previousPartnerId = player.partner_id;

  if (partnerId) {
    const { data: partner, error: partnerError } = await supabase
      .from("players")
      .select("id, session_id, partner_id")
      .eq("id", partnerId)
      .single();
    if (partnerError) throw partnerError;
    if (!partner || partner.session_id !== sessionId) {
      throw new Error("Partner must be in the same session");
    }

    if (partner.partner_id && partner.partner_id !== playerId) {
      await supabase
        .from("players")
        .update({ partner_id: null })
        .eq("id", partner.partner_id)
        .eq("partner_id", partnerId);
    }
  }

  if (previousPartnerId && previousPartnerId !== partnerId) {
    await supabase
      .from("players")
      .update({ partner_id: null })
      .eq("id", previousPartnerId)
      .eq("partner_id", playerId);
  }

  const { error: updateError } = await supabase
    .from("players")
    .update({ partner_id: partnerId })
    .eq("id", playerId);
  if (updateError) throw updateError;

  if (partnerId) {
    const { error: mutualError } = await supabase
      .from("players")
      .update({ partner_id: playerId })
      .eq("id", partnerId);
    if (mutualError) throw mutualError;
  }
}

export async function markPlayerPresent(
  supabase: Client,
  playerId: string,
  sessionId?: string
): Promise<void> {
  const { data: player } = await supabase
    .from("players")
    .select("name, session_id")
    .eq("id", playerId)
    .single();

  await updatePlayerRecord(supabase, playerId, {
    status: "Present",
    checkedInAt: new Date().toISOString(),
  });

  if (player) {
    await logActivity(
      supabase,
      sessionId ?? player.session_id,
      "check_in",
      player.name,
      "Checked In"
    );
  }
}

export async function markPlayerSecured(
  supabase: Client,
  playerId: string,
  sessionId?: string
): Promise<void> {
  await markPlayerPaid(supabase, playerId, sessionId);
}

export async function markPlayerPaid(
  supabase: Client,
  playerId: string,
  sessionId?: string
): Promise<void> {
  const { data: player } = await supabase
    .from("players")
    .select("name, session_id, status")
    .eq("id", playerId)
    .single();

  if (!player) throw new Error("Player not found");

  const now = new Date().toISOString();
  const updates: Parameters<typeof updatePlayerRecord>[2] = {
    securedAt: now,
  };

  if (player.status === "Registered") {
    updates.status = "Secured";
  }

  await updatePlayerRecord(supabase, playerId, updates);

  await logActivity(
    supabase,
    sessionId ?? player.session_id,
    "payment_confirmed",
    player.name,
    "Payment Confirmed"
  );
}

export async function markPlayerUnpaid(
  supabase: Client,
  playerId: string
): Promise<void> {
  const { data: player } = await supabase
    .from("players")
    .select("status")
    .eq("id", playerId)
    .single();

  if (!player) throw new Error("Player not found");

  const updates: Parameters<typeof updatePlayerRecord>[2] = {
    securedAt: null,
  };

  if (player.status === "Secured") {
    updates.status = "Registered";
  }

  await updatePlayerRecord(supabase, playerId, updates);
}

export async function markPlayerNoShow(
  supabase: Client,
  playerId: string,
  sessionId?: string
): Promise<void> {
  const { data: player } = await supabase
    .from("players")
    .select("session_id")
    .eq("id", playerId)
    .single();

  await updatePlayerRecord(supabase, playerId, {
    status: "No Show",
    isActive: false,
  });

  const sid = sessionId ?? player?.session_id;
  if (sid) {
    await processWaitlistPromotions(supabase, sid);
  }
}

export async function markPlayersPresentBulk(
  supabase: Client,
  sessionId: string,
  playerIds: string[]
): Promise<number> {
  let count = 0;
  for (const playerId of playerIds) {
    const { data: player } = await supabase
      .from("players")
      .select("status")
      .eq("id", playerId)
      .eq("session_id", sessionId)
      .single();
    if (
      !player ||
      !["Registered", "Secured"].includes(player.status)
    ) {
      continue;
    }
    await markPlayerPresent(supabase, playerId, sessionId);
    count += 1;
  }
  return count;
}

function sessionQueueSettings(session: Session): QueueSessionSettings {
  return getQueueSessionSettings(session);
}

export async function assignNextMatchToCourtRecord(
  supabase: Client,
  session: Session,
  courtId: string
): Promise<Match | null> {
  const { data: courtRow, error: courtError } = await supabase
    .from("courts")
    .select("*")
    .eq("id", courtId)
    .single();
  if (courtError) throw courtError;
  if (
    !isCourtRentalActive(mapCourt(courtRow), {
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
    })
  ) {
    return null;
  }

  const assignment = createNextMatchForCourt(
    session.players.map((p) => toQueuePlayer(p)),
    sessionQueueSettings(session)
  );
  if (!assignment) return null;

  const [a1, a2] = assignment.teams.teamA;
  const [b1, b2] = assignment.teams.teamB;
  return createMatchRecord(supabase, {
    sessionId: session.id,
    courtId,
    teamAPlayer1Id: a1.id,
    teamAPlayer2Id: a2.id,
    teamBPlayer1Id: b1.id,
    teamBPlayer2Id: b2.id,
  });
}

export async function resetCourtAfterMatch(
  supabase: Client,
  courtId: string,
  session?: Session
): Promise<Match | null> {
  await updateCourtStatus(supabase, courtId, "Empty");
  if (session?.autoAssignNextMatch) {
    return assignNextMatchToCourtRecord(supabase, session, courtId);
  }
  return null;
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

  const { data: court } = await supabase
    .from("courts")
    .select("court_number")
    .eq("id", input.courtId)
    .single();

  const { data: players } = await supabase
    .from("players")
    .select("name")
    .in("id", playerIds);

  const names = (players ?? []).map((p) => p.name);
  await logActivity(
    supabase,
    input.sessionId,
    "now_calling",
    `Court ${court?.court_number ?? "?"}`,
    names.join("\n"),
    { courtId: input.courtId, playerIds }
  );

  return mapMatch(data);
}

export async function startMatchRecord(
  supabase: Client,
  matchId: string,
  courtId: string,
  sessionId?: string
): Promise<void> {
  const { data: court } = await supabase
    .from("courts")
    .select("court_number, session_id")
    .eq("id", courtId)
    .single();

  const { error } = await supabase
    .from("matches")
    .update({
      status: "playing",
      started_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (error) throw error;
  await updateCourtStatus(supabase, courtId, "Playing");

  if (court) {
    await logActivity(
      supabase,
      sessionId ?? court.session_id,
      "match_started",
      `Court ${court.court_number} Match Started`,
      ""
    );
  }
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

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  const { data: court } = await supabase
    .from("courts")
    .select("court_number, session_id")
    .eq("id", courtId)
    .single();

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

  if (match && court) {
    const ids = [
      match.team_a_player_1,
      match.team_a_player_2,
      match.team_b_player_1,
      match.team_b_player_2,
    ].filter(Boolean) as string[];

    const { data: players } = await supabase
      .from("players")
      .select("id, name")
      .in("id", ids);

    const nameMap = new Map((players ?? []).map((p) => [p.id, p.name]));
    const teamA = [match.team_a_player_1, match.team_a_player_2]
      .map((id) => (id ? nameMap.get(id) : null))
      .filter(Boolean)
      .join(" & ");
    const teamB = [match.team_b_player_1, match.team_b_player_2]
      .map((id) => (id ? nameMap.get(id) : null))
      .filter(Boolean)
      .join(" & ");
    const winners = winnerTeam === "A" ? teamA : teamB;
    const losers = winnerTeam === "A" ? teamB : teamA;
    const score = `${teamAScore}–${teamBScore}`;

    await logActivity(
      supabase,
      court.session_id,
      "match_finished",
      `Court ${court.court_number} Winner`,
      `${winners}\ndef.\n${losers}\n${score}`,
      {
        courtId,
        matchId,
        winnerTeam,
        teamAScore,
        teamBScore,
        winners,
        losers,
      }
    );
  }
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

export async function logActivity(
  supabase: Client,
  sessionId: string,
  eventType: ActivityEventType,
  title: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      session_id: sessionId,
      event_type: eventType,
      title,
      description,
      metadata: (metadata ?? {}) as Json,
    })
    .select()
    .single();
  if (error) throw error;
  return mapActivityLog(data);
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
  await logActivity(
    supabase,
    sessionId,
    "side_change",
    `Court ${court.courtNumber} Side Change`,
    ""
  );
  return mapCourt(data);
}

export async function clearCourtRecord(
  supabase: Client,
  courtId: string,
  sessionId: string,
  courtNumber: number,
  matchId?: string,
  playerIds?: string[],
  session?: Session
): Promise<Match | null> {
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
  await logActivity(
    supabase,
    sessionId,
    "court_cleared",
    `Court ${courtNumber} Cleared`,
    ""
  );

  if (session?.autoAssignNextMatch) {
    return assignNextMatchToCourtRecord(supabase, session, courtId);
  }
  return null;
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

export async function fetchProfileByUserId(
  supabase: Client,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function createProfileRecord(
  supabase: Client,
  profile: {
    id: string;
    email: string;
    fullName: string;
    contactNumber?: string;
    gender: ProfileGender;
    skillLevel: PlayerSkillLevel;
  }
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName.trim(),
      contact_number: profile.contactNumber?.trim() || null,
      gender: profile.gender,
      skill_level: profile.skillLevel,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfileRecord(
  supabase: Client,
  userId: string,
  updates: {
    fullName?: string;
    contactNumber?: string;
    gender?: ProfileGender;
    skillLevel?: PlayerSkillLevel;
  }
): Promise<void> {
  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (updates.fullName !== undefined) payload.full_name = updates.fullName.trim();
  if (updates.contactNumber !== undefined)
    payload.contact_number = updates.contactNumber.trim() || null;
  if (updates.gender !== undefined) payload.gender = updates.gender;
  if (updates.skillLevel !== undefined) payload.skill_level = updates.skillLevel;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchMyRegistrations(
  supabase: Client,
  userId: string
) {
  const { data, error } = await supabase
    .from("players")
    .select("*, sessions(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function checkIsAdmin(supabase: Client): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export type { SessionSkillLevel };
