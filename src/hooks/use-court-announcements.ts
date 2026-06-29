"use client";

import { useEffect, useRef } from "react";
import {
  announceCourtCall,
  announceMatchWinner,
  courtCallInputFromActivity,
  matchWinnerInputFromActivity,
} from "@/lib/court-announcement";
import type { ActivityLog } from "@/types";

/** Announce court calls and match results from the live activity feed. */
export function useCourtAnnouncements(
  logs: ActivityLog[] | undefined,
  enabled: boolean,
  /** Skip one poll announce after a manual court call. */
  skipCourtPollRef?: React.RefObject<boolean>,
  /** Skip one poll announce after a manual winner congrats. */
  skipWinnerPollRef?: React.RefObject<boolean>
) {
  const seeded = useRef(false);
  const announced = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!logs) return;

    if (!seeded.current) {
      for (const log of logs) announced.current.add(log.id);
      seeded.current = true;
      return;
    }

    if (!enabled) return;

    const newLogs = logs
      .filter((log) => !announced.current.has(log.id))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    for (const log of newLogs) {
      announced.current.add(log.id);

      if (log.eventType === "now_calling") {
        if (skipCourtPollRef?.current) {
          skipCourtPollRef.current = false;
          continue;
        }
        const call = courtCallInputFromActivity(log);
        if (call) announceCourtCall(call);
        continue;
      }

      if (log.eventType === "match_finished") {
        if (skipWinnerPollRef?.current) {
          skipWinnerPollRef.current = false;
          continue;
        }
        const winner = matchWinnerInputFromActivity(log);
        if (winner) announceMatchWinner(winner);
      }
    }
  }, [logs, enabled, skipCourtPollRef, skipWinnerPollRef]);
}
