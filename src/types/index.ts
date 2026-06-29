export type SessionSkillLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Mixed";

export type PlayerSkillLevel =
  | "Beginner"
  | "Novice"
  | "Intermediate Low"
  | "Intermediate High"
  | "Advanced";

/** @deprecated Use PlayerSkillLevel or SessionSkillLevel */
export type SkillLevel = SessionSkillLevel;

export type SessionStatus = "open" | "full" | "closed";

export type PlayerStatus =
  | "Registered"
  | "Waitlisted"
  | "Secured"
  | "Present"
  | "Waiting"
  | "Playing"
  | "Finished"
  | "No Show";

export type CourtStatus = "Empty" | "Ready" | "Playing" | "Finished";

export type MatchStatus = "ready" | "playing" | "finished";

export type SkillMatchingMode = "Strict" | "Balanced" | "Flexible";

export type WinnerTeam = "A" | "B";

export type UserRole = "guest" | "admin";

export type ProfileGender = "Male" | "Female" | "Others";

export type ActivityEventType =
  | "match_finished"
  | "match_started"
  | "now_calling"
  | "check_in"
  | "payment_confirmed"
  | "side_change"
  | "court_cleared";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  contactNumber?: string;
  gender: ProfileGender;
  skillLevel: PlayerSkillLevel;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  sessionId: string;
  eventType: ActivityEventType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Player {
  id: string;
  sessionId: string;
  userId?: string;
  name: string;
  contactNumber?: string;
  gender?: ProfileGender;
  skillLevel: PlayerSkillLevel;
  note?: string;
  status: PlayerStatus;
  gamesPlayed: number;
  lastPlayedAt?: string;
  checkedInAt?: string;
  securedAt?: string;
  isActive: boolean;
  joinedAt: string;
  partnerId?: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  courtNumber: string;
  skillLevel: SessionSkillLevel;
  maxPlayers: number;
  status: SessionStatus;
  courtCount: number;
  targetScore: number;
  winBy: number;
  paymentRequired: boolean;
  paymentAmount?: number;
  paymentNote?: string;
  paymentInstructions?: string;
  allowUnpaidInQueue: boolean;
  autoAssignNextMatch: boolean;
  allowSideChange: boolean;
  sideChangePoint: number;
  skillMatchingMode: SkillMatchingMode;
  players: Player[];
}

export interface Court {
  id: string;
  sessionId: string;
  courtNumber: number;
  status: CourtStatus;
  sidesSwapped: boolean;
  sideChangeCount: number;
  lastSideChangeAt?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  sessionId: string;
  courtId?: string;
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  teamAScore?: number;
  teamBScore?: number;
  winnerTeam?: WinnerTeam;
  status: MatchStatus;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  contactNumber?: string;
  gender?: ProfileGender;
  skillLevel: PlayerSkillLevel;
}

export interface SessionActivity {
  id: string;
  sessionId: string;
  courtId?: string;
  message: string;
  createdAt: string;
}

export interface SessionBundle {
  session: Session;
  courts: Court[];
  matches: Match[];
  activity: SessionActivity[];
  activityLogs: ActivityLog[];
}
