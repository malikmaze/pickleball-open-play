import type { ActivityLog } from "@/types";

const STORAGE_KEY = "sisclub_court_announcements";
/** How many times each court call is spoken (with a short pause between). */
export const COURT_CALL_REPEAT_COUNT = 3;
export const MATCH_WINNER_REPEAT_COUNT = 2;
const PAUSE_BETWEEN_REPEATS_MS = 2_500;
const PAUSE_BETWEEN_JOBS_MS = 900;
const PAUSE_AFTER_NAME_MS = 150;
const PAUSE_AFTER_TEAM_MS = 550;
const PAUSE_AFTER_COURT_MS = 450;

let announceGeneration = 0;
let queueProcessing = false;

type AnnouncementJob =
  | { kind: "segments"; segments: SpeechSegment[]; repeats: number }
  | { kind: "plain"; text: string; repeats: number };

const announcementQueue: AnnouncementJob[] = [];

export type CourtCallInput = {
  courtNumber: number | string;
  teamA: [string, string];
  teamB: [string, string];
};

export type MatchWinnerInput = {
  courtNumber: number | string;
  winners: [string, string];
  teamAScore: number;
  teamBScore: number;
};

type SpeechSegment = {
  text: string;
  emphasis?: boolean;
  pauseAfterMs?: number;
};

export function isCourtAnnouncementsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "on";
}

export function setCourtAnnouncementsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  if (!enabled) cancelCourtCall();
}

export function isCourtAnnouncementSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isAnnouncementBusy(): boolean {
  return queueProcessing || announcementQueue.length > 0;
}

/** Plain-text preview of the call (names emphasized in speech, not in this string). */
export function buildCourtCallScript(call: CourtCallInput): string {
  const court = `Court ${call.courtNumber}`;
  return (
    `${court}. ` +
    `${call.teamA[0]} and ${call.teamA[1]}... ` +
    `versus... ` +
    `${call.teamB[0]} and ${call.teamB[1]}. ` +
    `Please proceed to ${court}.`
  );
}

function buildCourtCallSegments(call: CourtCallInput): SpeechSegment[] {
  const court = `Court ${call.courtNumber}`;
  const [a1, a2] = call.teamA;
  const [b1, b2] = call.teamB;

  return [
    { text: court, pauseAfterMs: PAUSE_AFTER_COURT_MS },
    { text: a1, emphasis: true, pauseAfterMs: PAUSE_AFTER_NAME_MS },
    { text: "and" },
    { text: a2, emphasis: true, pauseAfterMs: PAUSE_AFTER_TEAM_MS },
    { text: "versus", pauseAfterMs: PAUSE_AFTER_TEAM_MS },
    { text: b1, emphasis: true, pauseAfterMs: PAUSE_AFTER_NAME_MS },
    { text: "and" },
    { text: b2, emphasis: true, pauseAfterMs: PAUSE_AFTER_COURT_MS },
    { text: `Please proceed to ${court}` },
  ];
}

function buildWinnerCongratulationsSegments(
  input: MatchWinnerInput
): SpeechSegment[] {
  const court = `Court ${input.courtNumber}`;
  const [w1, w2] = input.winners;

  return [
    { text: court, pauseAfterMs: PAUSE_AFTER_COURT_MS },
    { text: "Congratulations", pauseAfterMs: 400 },
    { text: "to" },
    { text: w1, emphasis: true, pauseAfterMs: PAUSE_AFTER_NAME_MS },
    { text: "and" },
    { text: w2, emphasis: true, pauseAfterMs: PAUSE_AFTER_TEAM_MS },
    {
      text: `Final score ${input.teamAScore} to ${input.teamBScore}`,
    },
  ];
}

export function matchWinnerInputFromActivity(
  log: ActivityLog
): MatchWinnerInput | null {
  if (log.eventType !== "match_finished") return null;

  const meta = log.metadata;
  const courtNumber =
    (meta.courtNumber as number | string | undefined) ??
    log.title.replace(/^Court\s*/i, "").replace(/\s*Winner$/i, "");

  const winnerNames = meta.winnerNames as string[] | undefined;
  const teamAScore = meta.teamAScore as number | undefined;
  const teamBScore = meta.teamBScore as number | undefined;

  if (
    winnerNames?.length === 2 &&
    typeof teamAScore === "number" &&
    typeof teamBScore === "number"
  ) {
    return {
      courtNumber,
      winners: [winnerNames[0], winnerNames[1]],
      teamAScore,
      teamBScore,
    };
  }

  const winnersLine = log.description.split("\n")[0]?.trim();
  const scoreLine = log.description.split("\n")[2]?.trim();
  if (!winnersLine) return null;

  const names = winnersLine.split(/\s*&\s*/);
  if (names.length !== 2) return null;

  const scoreParts = scoreLine?.match(/(\d+)\D+(\d+)/);
  if (!scoreParts) return null;

  return {
    courtNumber,
    winners: [names[0], names[1]],
    teamAScore: Number(scoreParts[1]),
    teamBScore: Number(scoreParts[2]),
  };
}

export function courtCallInputFromActivity(
  log: ActivityLog
): CourtCallInput | null {
  if (log.eventType !== "now_calling") return null;

  const meta = log.metadata;
  const courtNumber =
    (meta.courtNumber as number | string | undefined) ??
    log.title.replace(/^Court\s*/i, "");

  const teamA = meta.teamA as string[] | undefined;
  const teamB = meta.teamB as string[] | undefined;

  if (teamA?.length === 2 && teamB?.length === 2) {
    return {
      courtNumber,
      teamA: [teamA[0], teamA[1]],
      teamB: [teamB[0], teamB[1]],
    };
  }

  const names = log.description.split("\n").map((n) => n.trim()).filter(Boolean);
  if (names.length >= 4) {
    return {
      courtNumber,
      teamA: [names[0], names[1]],
      teamB: [names[2], names[3]],
    };
  }

  return null;
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /samantha|karen|moira|google us english|premium|natural|enhanced/i.test(
        v.name
      )
  );
  return (
    preferred ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

let voicesPrimed = false;

function primeVoices(): void {
  if (voicesPrimed || typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const load = () => {
    if (synth.getVoices().length > 0) voicesPrimed = true;
  };
  load();
  synth.addEventListener("voiceschanged", load);
}

function applyUtteranceStyle(
  utterance: SpeechSynthesisUtterance,
  emphasis: boolean,
  voice: SpeechSynthesisVoice | null
) {
  if (voice) utterance.voice = voice;
  if (emphasis) {
    utterance.rate = 0.8;
    utterance.pitch = 1.14;
    utterance.volume = 1;
  } else {
    utterance.rate = 0.93;
    utterance.pitch = 1;
    utterance.volume = 1;
  }
}

function sleep(ms: number, generation: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (generation !== announceGeneration) resolve();
      else resolve();
    }, ms);
  });
}

function speakSegments(
  synth: SpeechSynthesis,
  segments: SpeechSegment[],
  voice: SpeechSynthesisVoice | null,
  generation: number
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;

    const speakNext = () => {
      if (generation !== announceGeneration) {
        resolve();
        return;
      }
      if (index >= segments.length) {
        resolve();
        return;
      }

      const segment = segments[index++];
      const utterance = new SpeechSynthesisUtterance(segment.text);
      applyUtteranceStyle(utterance, Boolean(segment.emphasis), voice);

      const advance = () => {
        if (generation !== announceGeneration) {
          resolve();
          return;
        }
        const delay =
          segment.pauseAfterMs ?? (segment.emphasis ? PAUSE_AFTER_NAME_MS : 0);
        if (delay > 0) {
          window.setTimeout(speakNext, delay);
        } else {
          speakNext();
        }
      };

      utterance.onend = advance;
      utterance.onerror = advance;
      synth.speak(utterance);
    };

    speakNext();
  });
}

function runJob(job: AnnouncementJob, generation: number): Promise<void> {
  if (!isCourtAnnouncementSupported()) return Promise.resolve();
  if (generation !== announceGeneration) return Promise.resolve();

  primeVoices();
  const synth = window.speechSynthesis;
  const voice = pickEnglishVoice();

  if (job.kind === "segments") {
    let remaining = Math.max(1, job.repeats);

    const speakPass = (): Promise<void> => {
      if (generation !== announceGeneration) return Promise.resolve();
      return speakSegments(synth, job.segments, voice, generation).then(() => {
        if (generation !== announceGeneration) return;
        remaining -= 1;
        if (remaining <= 0) return;
        return sleep(PAUSE_BETWEEN_REPEATS_MS, generation).then(speakPass);
      });
    };

    return speakPass();
  }

  let remaining = Math.max(1, job.repeats);

  const speakPlain = (): Promise<void> => {
    if (generation !== announceGeneration) return Promise.resolve();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(job.text);
      applyUtteranceStyle(utterance, false, voice);

      const done = () => {
        if (generation !== announceGeneration) {
          resolve();
          return;
        }
        remaining -= 1;
        if (remaining <= 0) {
          resolve();
          return;
        }
        window.setTimeout(() => {
          void speakPlain().then(resolve);
        }, PAUSE_BETWEEN_REPEATS_MS);
      };

      utterance.onend = done;
      utterance.onerror = done;
      synth.speak(utterance);
    });
  };

  return speakPlain();
}

async function processAnnouncementQueue(): Promise<void> {
  if (queueProcessing) return;
  queueProcessing = true;

  while (announcementQueue.length > 0) {
    const generation = announceGeneration;
    const job = announcementQueue.shift();
    if (!job || generation !== announceGeneration) continue;

    await runJob(job, generation);

    if (generation !== announceGeneration) break;
    if (announcementQueue.length > 0) {
      await sleep(PAUSE_BETWEEN_JOBS_MS, generation);
    }
  }

  queueProcessing = false;

  if (announcementQueue.length > 0) {
    void processAnnouncementQueue();
  }
}

function enqueueAnnouncement(job: AnnouncementJob): void {
  if (!isCourtAnnouncementSupported()) return;
  announcementQueue.push(job);
  void processAnnouncementQueue();
}

/** Stop any queued or in-progress announcements. */
export function cancelCourtCall(): void {
  announceGeneration += 1;
  announcementQueue.length = 0;
  queueProcessing = false;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/** Speak a court call — queued so announcements never overlap. */
export function announceCourtCall(
  call: CourtCallInput | string,
  repeats: number = COURT_CALL_REPEAT_COUNT
): void {
  if (!isCourtAnnouncementSupported()) return;

  if (typeof call === "string") {
    if (!call.trim()) return;
    enqueueAnnouncement({ kind: "plain", text: call, repeats });
    return;
  }

  enqueueAnnouncement({
    kind: "segments",
    segments: buildCourtCallSegments(call),
    repeats,
  });
}

/** Congratulate the winning team — queued after any current announcement. */
export function announceMatchWinner(
  input: MatchWinnerInput,
  repeats: number = MATCH_WINNER_REPEAT_COUNT
): void {
  enqueueAnnouncement({
    kind: "segments",
    segments: buildWinnerCongratulationsSegments(input),
    repeats,
  });
}
