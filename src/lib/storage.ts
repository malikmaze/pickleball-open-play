import { createSampleSessions } from "@/lib/sample-data";
import { STORAGE_KEY } from "@/lib/constants";
import type { AppData, Player, PlayerProfile, Session, SessionStatus } from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDefaultData(): AppData {
  return {
    sessions: createSampleSessions(),
    playerProfile: null,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") {
    return getDefaultData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = getDefaultData();
      saveData(data);
      return data;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    const data = getDefaultData();
    saveData(data);
    return data;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function computeSessionStatus(session: Session): SessionStatus {
  if (session.status === "closed") return "closed";
  if (session.players.length >= session.maxPlayers) return "full";
  return "open";
}

export function withUpdatedStatus(session: Session): Session {
  return { ...session, status: computeSessionStatus(session) };
}

export function getTodaySessions(sessions: Session[]): Session[] {
  const today = new Date().toISOString().split("T")[0];
  return sessions
    .filter((s) => s.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map(withUpdatedStatus);
}

export function joinSession(
  data: AppData,
  sessionId: string,
  profile: PlayerProfile
): AppData {
  const sessions = data.sessions.map((session) => {
    if (session.id !== sessionId) return session;

    const alreadyJoined = session.players.some((p) => p.id === profile.id);
    if (alreadyJoined) return withUpdatedStatus(session);

    const player: Player = {
      id: profile.id,
      name: profile.name,
      contactNumber: profile.contactNumber,
      skillLevel: profile.skillLevel,
      joinedAt: new Date().toISOString(),
    };

    return withUpdatedStatus({
      ...session,
      players: [...session.players, player],
    });
  });

  return { ...data, sessions, playerProfile: profile };
}

export function leaveSession(
  data: AppData,
  sessionId: string,
  playerId: string
): AppData {
  const sessions = data.sessions.map((session) => {
    if (session.id !== sessionId) return session;
    return withUpdatedStatus({
      ...session,
      players: session.players.filter((p) => p.id !== playerId),
    });
  });

  return { ...data, sessions };
}

export function savePlayerProfile(
  data: AppData,
  profile: Omit<PlayerProfile, "id"> & { id?: string }
): AppData {
  const playerProfile: PlayerProfile = {
    id: profile.id ?? generateId(),
    name: profile.name.trim(),
    contactNumber: profile.contactNumber?.trim() || undefined,
    skillLevel: profile.skillLevel,
  };

  return { ...data, playerProfile };
}

export function createSession(
  data: AppData,
  session: Omit<Session, "id" | "status" | "players">
): AppData {
  const newSession: Session = {
    ...session,
    id: generateId(),
    status: "open",
    players: [],
  };

  return {
    ...data,
    sessions: [...data.sessions, withUpdatedStatus(newSession)],
  };
}

export function updateSession(
  data: AppData,
  sessionId: string,
  updates: Partial<Omit<Session, "id" | "players">>
): AppData {
  const sessions = data.sessions.map((session) => {
    if (session.id !== sessionId) return session;
    return withUpdatedStatus({ ...session, ...updates });
  });

  return { ...data, sessions };
}

export function deleteSession(data: AppData, sessionId: string): AppData {
  return {
    ...data,
    sessions: data.sessions.filter((s) => s.id !== sessionId),
  };
}

export function clearSessionPlayers(data: AppData, sessionId: string): AppData {
  const sessions = data.sessions.map((session) => {
    if (session.id !== sessionId) return session;
    return withUpdatedStatus({ ...session, players: [], status: "open" });
  });

  return { ...data, sessions };
}

export function toggleSessionClosed(data: AppData, sessionId: string): AppData {
  const sessions = data.sessions.map((session) => {
    if (session.id !== sessionId) return session;
    const nextStatus: SessionStatus =
      session.status === "closed" ? "open" : "closed";
    return withUpdatedStatus({ ...session, status: nextStatus });
  });

  return { ...data, sessions };
}

export { generateId };
