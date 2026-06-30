"use client";

import { Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NextMatchAssignment } from "@/lib/queue/queue-engine";
import type { CourtPlayerInfo } from "./types";
import { CourtPlayerChip, PickleballCourtView } from "./pickleball-court-view";

const EMPTY_TEAM: [CourtPlayerInfo, CourtPlayerInfo] = [
  { name: "—" },
  { name: "—" },
];

function nextMatchTeams(assignment: NextMatchAssignment) {
  const [a1, a2] = assignment.teams.teamA;
  const [b1, b2] = assignment.teams.teamB;
  const toInfo = (p: typeof a1): CourtPlayerInfo => ({
    name: p.name,
    skill: p.skillLevel,
    gamesPlayed: p.gamesPlayed,
    wins: p.wins,
    losses: p.losses,
  });
  return {
    teamA: [toInfo(a1), toInfo(a2)] as [CourtPlayerInfo, CourtPlayerInfo],
    teamB: [toInfo(b1), toInfo(b2)] as [CourtPlayerInfo, CourtPlayerInfo],
  };
}

export function EmptyCourtView({
  nextMatch,
  queueCount,
  targetScore,
  winBy,
  className,
}: {
  nextMatch?: NextMatchAssignment | null;
  queueCount: number;
  targetScore: number;
  winBy: number;
  className?: string;
}) {
  const hasNext = Boolean(nextMatch);
  const preview = nextMatch ? nextMatchTeams(nextMatch) : null;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col space-y-3 rounded-2xl border border-pink-100/80 bg-gradient-to-br from-pink-50/50 to-violet-50/30 p-3",
        className
      )}
    >
      <PickleballCourtView
        teamA={EMPTY_TEAM}
        teamB={EMPTY_TEAM}
        emptyLabel="Open court"
      />

      {hasNext && preview ? (
        <div className="space-y-3 border-t border-pink-100/80 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-pink-600">
              Next from queue
            </p>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
              game to {targetScore} · win by {winBy}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-pink-500">
                <Heart className="h-3 w-3 fill-pink-300" />
                Team A
              </p>
              <CourtPlayerChip player={preview.teamA[0]} team="A" />
              <CourtPlayerChip player={preview.teamA[1]} team="A" />
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-500">
                <Heart className="h-3 w-3 fill-violet-300" />
                Team B
              </p>
              <CourtPlayerChip player={preview.teamB[0]} team="B" />
              <CourtPlayerChip player={preview.teamB[1]} team="B" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-pink-200/60 bg-white/50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-pink-900">
              Waiting for next match
            </p>
            <p className="text-xs text-muted-foreground">
              {queueCount >= 4
                ? "Queue is building — assign when ready."
                : `${queueCount} in queue · need 4 to play`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
