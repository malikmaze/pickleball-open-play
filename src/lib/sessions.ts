import { normalizePlayerSkill } from "@/lib/constants";
import type {
  CourtRow,
  Database,
  MatchRow,
  PlayerRow,
  SessionRow,
} from "@/utils/supabase/database.types";

type ActivityRow = Database["public"]["Tables"]["session_activity"]["Row"];
import type {
  Court,
  CourtStatus,
  Match,
  MatchStatus,
  Player,
  PlayerSkillLevel,
  PlayerStatus,
  Session,
  SessionActivity,
  SessionSkillLevel,
  SessionStatus,
  SkillMatchingMode,
  WinnerTeam,
} from "@/types";

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
    sessionId: row.session_id,
    name: row.name,
    contactNumber: row.contact_number ?? undefined,
    skillLevel: normalizePlayerSkill(row.skill_level),
    note: row.note ?? undefined,
    status: row.status as PlayerStatus,
    gamesPlayed: row.games_played ?? 0,
    lastPlayedAt: row.last_played_at ?? undefined,
    checkedInAt: row.checked_in_at ?? undefined,
    securedAt: row.secured_at ?? undefined,
    isActive: row.is_active ?? true,
    joinedAt: row.joined_at,
  };
}

export function mapCourt(row: CourtRow): Court {
  return {
    id: row.id,
    sessionId: row.session_id,
    courtNumber: row.court_number,
    status: row.status as CourtStatus,
    sidesSwapped: row.sides_swapped ?? false,
    sideChangeCount: row.side_change_count ?? 0,
    lastSideChangeAt: row.last_side_change_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapMatch(row: MatchRow): Match {
  return {
    id: row.id,
    sessionId: row.session_id,
    courtId: row.court_id ?? undefined,
    teamAPlayer1Id: row.team_a_player_1!,
    teamAPlayer2Id: row.team_a_player_2!,
    teamBPlayer1Id: row.team_b_player_1!,
    teamBPlayer2Id: row.team_b_player_2!,
    teamAScore: row.team_a_score ?? undefined,
    teamBScore: row.team_b_score ?? undefined,
    winnerTeam: (row.winner_team as WinnerTeam) ?? undefined,
    status: row.status as MatchStatus,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapActivity(row: ActivityRow): SessionActivity {
  return {
    id: row.id,
    sessionId: row.session_id,
    courtId: row.court_id ?? undefined,
    message: row.message,
    createdAt: row.created_at,
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
    skillLevel: row.skill_level as SessionSkillLevel,
    maxPlayers: row.max_players,
    status: computeSessionStatus(
      row.status,
      mappedPlayers.length,
      row.max_players
    ),
    courtCount: row.court_count ?? 1,
    targetScore: row.target_score ?? 15,
    winBy: row.win_by ?? 2,
    paymentRequired: row.payment_required ?? false,
    paymentAmount: row.payment_amount ?? undefined,
    paymentNote: row.payment_note ?? undefined,
    paymentInstructions: row.payment_instructions ?? undefined,
    allowUnpaidInQueue: row.allow_unpaid_in_queue ?? true,
    autoAssignNextMatch: row.auto_assign_next_match ?? false,
    allowSideChange: row.allow_side_change ?? true,
    sideChangePoint: row.side_change_point ?? 8,
    skillMatchingMode: (row.skill_matching_mode as SkillMatchingMode) ?? "Balanced",
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
    court_count: data.courtCount,
    target_score: data.targetScore,
    win_by: data.winBy,
    payment_required: data.paymentRequired,
    payment_amount: data.paymentAmount ?? null,
    payment_note: data.paymentNote ?? null,
    payment_instructions: data.paymentInstructions ?? null,
    allow_unpaid_in_queue: data.allowUnpaidInQueue,
    auto_assign_next_match: data.autoAssignNextMatch,
    allow_side_change: data.allowSideChange,
    side_change_point: data.sideChangePoint,
    skill_matching_mode: data.skillMatchingMode,
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
  if (data.courtCount !== undefined) update.court_count = data.courtCount;
  if (data.targetScore !== undefined) update.target_score = data.targetScore;
  if (data.winBy !== undefined) update.win_by = data.winBy;
  if (data.paymentRequired !== undefined)
    update.payment_required = data.paymentRequired;
  if (data.paymentAmount !== undefined)
    update.payment_amount = data.paymentAmount ?? null;
  if (data.paymentNote !== undefined) update.payment_note = data.paymentNote ?? null;
  if (data.paymentInstructions !== undefined)
    update.payment_instructions = data.paymentInstructions ?? null;
  if (data.allowUnpaidInQueue !== undefined)
    update.allow_unpaid_in_queue = data.allowUnpaidInQueue;
  if (data.autoAssignNextMatch !== undefined)
    update.auto_assign_next_match = data.autoAssignNextMatch;
  if (data.allowSideChange !== undefined)
    update.allow_side_change = data.allowSideChange;
  if (data.sideChangePoint !== undefined)
    update.side_change_point = data.sideChangePoint;
  if (data.skillMatchingMode !== undefined)
    update.skill_matching_mode = data.skillMatchingMode;
  return update;
}

export function defaultSessionFields(): Pick<
  Session,
  | "courtCount"
  | "targetScore"
  | "winBy"
  | "paymentRequired"
  | "allowUnpaidInQueue"
  | "autoAssignNextMatch"
  | "allowSideChange"
  | "sideChangePoint"
  | "skillMatchingMode"
> {
  return {
    courtCount: 1,
    targetScore: 15,
    winBy: 2,
    paymentRequired: false,
    allowUnpaidInQueue: true,
    autoAssignNextMatch: false,
    allowSideChange: true,
    sideChangePoint: 8,
    skillMatchingMode: "Balanced",
  };
}
