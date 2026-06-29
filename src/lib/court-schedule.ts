import type { Court } from "@/types";

export type CourtScheduleEntry = {
  courtNumber: number;
  startTime: string;
  endTime: string;
};

export type CourtRentalStatus =
  | { available: true }
  | {
      available: false;
      reason: "not_yet" | "expired" | "past_session" | "future_session";
    };

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCourtRentalTimes(
  court: Pick<Court, "rentalStartTime" | "rentalEndTime">,
  session: { startTime: string; endTime: string }
): { startTime: string; endTime: string } {
  return {
    startTime: court.rentalStartTime ?? session.startTime,
    endTime: court.rentalEndTime ?? session.endTime,
  };
}

export function getCourtRentalStatus(
  court: Pick<Court, "rentalStartTime" | "rentalEndTime">,
  session: { date: string; startTime: string; endTime: string },
  now: Date = new Date()
): CourtRentalStatus {
  const today = localDateString(now);

  if (today < session.date) {
    return { available: false, reason: "future_session" };
  }
  if (today > session.date) {
    return { available: false, reason: "past_session" };
  }

  const { startTime, endTime } = getCourtRentalTimes(court, session);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (nowMinutes < startMinutes) {
    return { available: false, reason: "not_yet" };
  }
  if (nowMinutes >= endMinutes) {
    return { available: false, reason: "expired" };
  }

  return { available: true };
}

export function isCourtRentalActive(
  court: Pick<Court, "rentalStartTime" | "rentalEndTime">,
  session: { date: string; startTime: string; endTime: string },
  now?: Date
): boolean {
  return getCourtRentalStatus(court, session, now).available;
}

export function courtRentalUnavailableCopy(status: CourtRentalStatus): string {
  if (status.available) return "";

  switch (status.reason) {
    case "not_yet":
      return "Not available yet";
    case "expired":
      return "Not available — rental ended";
    case "past_session":
      return "Not available — session ended";
    case "future_session":
      return "Not available yet";
  }
}

export function formatEffectiveCourtRentalWindow(
  court: Pick<Court, "rentalStartTime" | "rentalEndTime">,
  session: { startTime: string; endTime: string }
): string {
  const { startTime, endTime } = getCourtRentalTimes(court, session);
  return `${formatDisplayTime(startTime)} – ${formatDisplayTime(endTime)}`;
}

export function syncCourtScheduleCount(
  existing: CourtScheduleEntry[],
  courtCount: number,
  sessionStart: string,
  sessionEnd: string
): CourtScheduleEntry[] {
  const byNumber = new Map(existing.map((entry) => [entry.courtNumber, entry]));
  return Array.from({ length: courtCount }, (_, index) => {
    const courtNumber = index + 1;
    const prior = byNumber.get(courtNumber);
    return {
      courtNumber,
      startTime: prior?.startTime ?? sessionStart,
      endTime: prior?.endTime ?? sessionEnd,
    };
  });
}

export function courtSchedulesFromCourts(
  courts: Pick<Court, "courtNumber" | "rentalStartTime" | "rentalEndTime">[],
  courtCount: number,
  sessionStart: string,
  sessionEnd: string
): CourtScheduleEntry[] {
  const sorted = [...courts].sort((a, b) => a.courtNumber - b.courtNumber);
  return syncCourtScheduleCount(
    sorted.map((court) => ({
      courtNumber: court.courtNumber,
      startTime: court.rentalStartTime ?? sessionStart,
      endTime: court.rentalEndTime ?? sessionEnd,
    })),
    courtCount,
    sessionStart,
    sessionEnd
  );
}

export function courtsUseSessionRentalTime(
  courts: Pick<Court, "rentalStartTime" | "rentalEndTime">[]
): boolean {
  return courts.every(
    (court) => !court.rentalStartTime && !court.rentalEndTime
  );
}

export function validateCourtSchedules(
  schedules: CourtScheduleEntry[],
  useSessionTime: boolean
): string | null {
  if (useSessionTime) return null;

  for (const schedule of schedules) {
    if (!schedule.startTime || !schedule.endTime) {
      return `Court ${schedule.courtNumber} needs a rental start and end time.`;
    }
    if (schedule.endTime <= schedule.startTime) {
      return `Court ${schedule.courtNumber}: end time must be after start time.`;
    }
  }

  return null;
}

export function formatCourtRentalWindow(
  court: Pick<Court, "rentalStartTime" | "rentalEndTime">,
  session: { startTime: string; endTime: string }
): string | null {
  if (!court.rentalStartTime && !court.rentalEndTime) return null;

  const start = court.rentalStartTime ?? session.startTime;
  const end = court.rentalEndTime ?? session.endTime;

  if (start === session.startTime && end === session.endTime) return null;

  return `${formatDisplayTime(start)} – ${formatDisplayTime(end)}`;
}

export function formatSessionCourtsLabel(courtCount: number): string {
  if (courtCount <= 1) return "1 court";
  return `${courtCount} courts`;
}
