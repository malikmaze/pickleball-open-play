import { SAMPLE_MATCH_PLAYERS } from "@/lib/test-players";
import { getTodayDate } from "@/lib/sessions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import type { Player } from "@/types";
import {
  addTestPlayersToSession,
  createSessionRecord,
  fetchSessionById,
  logSessionActivity,
  syncCourtsForSession,
  updateCourtStatus,
} from "@/utils/supabase/queries";

type Client = SupabaseClient<Database>;

const SAMPLE_TITLE = "Sample Open Play";

async function clearExistingSample(supabase: Client) {
  const today = getTodayDate();
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("title", SAMPLE_TITLE)
    .eq("date", today);

  if (existing?.length) {
    await supabase
      .from("sessions")
      .delete()
      .in(
        "id",
        existing.map((s) => s.id)
      );
  }
}

function playerIdByName(players: Player[], name: string): string {
  const player = players.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  if (!player) throw new Error(`Sample player not found: ${name}`);
  return player.id;
}

export async function seedSamplePlaySession(supabase: Client): Promise<string> {
  await clearExistingSample(supabase);

  const session = await createSessionRecord(supabase, {
    title: SAMPLE_TITLE,
    date: getTodayDate(),
    startTime: "18:00",
    endTime: "21:00",
    location: "Sunset Park Courts",
    courtNumber: "Courts 1–3",
    skillLevel: "Mixed",
    maxPlayers: 24,
    courtCount: 3,
    targetScore: 15,
    winBy: 2,
    paymentRequired: false,
    allowUnpaidInQueue: true,
    autoAssignNextMatch: false,
    allowSideChange: true,
    sideChangePoint: 8,
    skillMatchingMode: "Balanced",
  });

  const inserted = await addTestPlayersToSession(supabase, session.id);
  if (inserted === 0) {
    throw new Error(
      "No test players added. Run migration 004_test_players.sql in Supabase."
    );
  }

  const fullSession = await fetchSessionById(supabase, session.id);
  if (!fullSession) throw new Error("Failed to load sample session");

  const courts = await syncCourtsForSession(supabase, session.id, 3);
  const [court1, court2, court3] = courts;
  const players = fullSession.players;
  const now = new Date();
  const matchStarted = new Date(now.getTime() - 18 * 60_000).toISOString();
  const match3Started = new Date(now.getTime() - 12 * 60_000).toISOString();

  const c1 = SAMPLE_MATCH_PLAYERS.court1;
  const { error: match1Error } = await supabase.from("matches").insert({
    session_id: session.id,
    court_id: court1.id,
    team_a_player_1: playerIdByName(players, c1.teamA[0]),
    team_a_player_2: playerIdByName(players, c1.teamA[1]),
    team_b_player_1: playerIdByName(players, c1.teamB[0]),
    team_b_player_2: playerIdByName(players, c1.teamB[1]),
    team_a_score: c1.scoreA,
    team_b_score: c1.scoreB,
    status: "playing",
    started_at: matchStarted,
  });
  if (match1Error) throw match1Error;
  await updateCourtStatus(supabase, court1.id, "Playing");

  const c2 = SAMPLE_MATCH_PLAYERS.court2;
  const { error: match2Error } = await supabase.from("matches").insert({
    session_id: session.id,
    court_id: court2.id,
    team_a_player_1: playerIdByName(players, c2.teamA[0]),
    team_a_player_2: playerIdByName(players, c2.teamA[1]),
    team_b_player_1: playerIdByName(players, c2.teamB[0]),
    team_b_player_2: playerIdByName(players, c2.teamB[1]),
    status: "ready",
  });
  if (match2Error) throw match2Error;
  await updateCourtStatus(supabase, court2.id, "Ready");

  const c3 = SAMPLE_MATCH_PLAYERS.court3;
  const { error: match3Error } = await supabase.from("matches").insert({
    session_id: session.id,
    court_id: court3.id,
    team_a_player_1: playerIdByName(players, c3.teamA[0]),
    team_a_player_2: playerIdByName(players, c3.teamA[1]),
    team_b_player_1: playerIdByName(players, c3.teamB[0]),
    team_b_player_2: playerIdByName(players, c3.teamB[1]),
    team_a_score: c3.scoreA,
    team_b_score: c3.scoreB,
    status: "playing",
    started_at: match3Started,
  });
  if (match3Error) throw match3Error;
  await updateCourtStatus(supabase, court3.id, "Playing");

  await logSessionActivity(
    supabase,
    session.id,
    "Sample session started — welcome!"
  );
  await logSessionActivity(
    supabase,
    session.id,
    "Court 1: Mia & Jenna vs Alexis & Sophie (11–8)",
    court1.id
  );
  await logSessionActivity(
    supabase,
    session.id,
    "Court 2 next match assigned",
    court2.id
  );
  await logSessionActivity(
    supabase,
    session.id,
    "Court 3: Tess & Stella vs Daisy & Lily (9–10)",
    court3.id
  );

  return session.id;
}
