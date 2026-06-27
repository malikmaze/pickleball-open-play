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

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  contactNumber?: string;
  skillLevel: PlayerSkillLevel;
  note?: string;
  status: PlayerStatus;
  gamesPlayed: number;
  lastPlayedAt?: string;
  checkedInAt?: string;
  securedAt?: string;
  isActive: boolean;
  joinedAt: string;
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
}
