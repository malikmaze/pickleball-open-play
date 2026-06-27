export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Mixed";

export type SessionStatus = "open" | "full" | "closed";

export interface Player {
  id: string;
  name: string;
  contactNumber?: string;
  skillLevel: SkillLevel;
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
  skillLevel: SkillLevel;
  maxPlayers: number;
  status: SessionStatus;
  players: Player[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  contactNumber?: string;
  skillLevel: SkillLevel;
}

export interface AppData {
  sessions: Session[];
  playerProfile: PlayerProfile | null;
}
