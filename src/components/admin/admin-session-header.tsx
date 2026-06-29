"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { CourtSessionStats } from "@/components/courts/court-session-stats";
import {
  adminBtnOutline,
  adminSessionTitleCardClass,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEligiblePlayers, toQueuePlayer } from "@/lib/queue/queue-engine";
import { formatSessionDate } from "@/lib/sessions";
import {
  countAdmittedPlayers,
  getWaitlistedPlayers,
} from "@/lib/waitlist";
import type { Session } from "@/types";

export function AdminSessionHeader({
  session,
  sessionId,
  onRefresh,
  loading,
  extra,
  showStats = false,
}: {
  session: Session;
  sessionId: string;
  onRefresh: () => void;
  loading?: boolean;
  extra?: ReactNode;
  /** Live counts — only useful on Overview; other tabs show the same data in context. */
  showStats?: boolean;
}) {
  const eligible = getEligiblePlayers(session.players.map(toQueuePlayer));
  const checkedIn = session.players.filter((p) =>
    ["Present", "Waiting", "Playing", "Secured"].includes(p.status)
  ).length;
  const playing = session.players.filter((p) => p.status === "Playing").length;

  return (
    <div className={adminSessionTitleCardClass}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
            {session.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-sisclub-green-dark/70">
            <span>{formatSessionDate(session.date)}</span>
            <span className="text-pink-300" aria-hidden>
              ·
            </span>
            <span>
              {session.startTime} – {session.endTime}
            </span>
            <span className="text-pink-300" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-sisclub-pink" aria-hidden />
              {session.location}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {extra}
          <Link
            href={`/sessions/${sessionId}/live`}
            className={cn(
              "inline-flex h-9 items-center px-3 text-sm font-medium hover:bg-sisclub-pink-soft",
              adminBtnOutline
            )}
          >
            Guest live
          </Link>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className={adminBtnOutline}
          >
            <RefreshCw
              className={
                loading ? "mr-1.5 h-4 w-4 animate-spin" : "mr-1.5 h-4 w-4"
              }
            />
            Refresh
          </Button>
        </div>
      </div>

      {showStats && (
        <div className="mt-4">
          <CourtSessionStats
          stats={[
            {
              label: "Booked",
              value: `${countAdmittedPlayers(session.players)} / ${session.maxPlayers}`,
            },
            {
              label: "Waitlist",
              value: `${getWaitlistedPlayers(session.players).length}`,
            },
            { label: "Checked in", value: `${checkedIn}` },
            { label: "In queue", value: `${eligible.length}` },
            { label: "Playing", value: `${playing}` },
            {
              label: "Auto assign",
              value: session.autoAssignNextMatch ? "ON" : "OFF",
              highlight: session.autoAssignNextMatch,
            },
          ]}
          />
        </div>
      )}
    </div>
  );
}
