"use client";

import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import { adminBtnPrimary, adminCardClass } from "@/components/admin/admin-ui";
import { CourtPlayerChip } from "@/components/courts/pickleball-court-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NextMatchAssignment } from "@/lib/queue/queue-engine";
import { recordTierLabel } from "@/lib/player-stats";
import { cn } from "@/lib/utils";

function teamsFromAssignment(assignment: NextMatchAssignment) {
  const [a1, a2] = assignment.teams.teamA;
  const [b1, b2] = assignment.teams.teamB;
  const toChip = (p: typeof a1) => ({
    name: p.name,
    skill: p.skillLevel,
    gamesPlayed: p.gamesPlayed,
    wins: p.wins,
    losses: p.losses,
  });
  return {
    teamA: [toChip(a1), toChip(a2)] as const,
    teamB: [toChip(b1), toChip(b2)] as const,
  };
}

export function QueueNextUpCard({
  queueCount,
  nextMatch,
  courtsHref,
  className,
}: {
  queueCount: number;
  nextMatch: NextMatchAssignment | null;
  courtsHref: string;
  className?: string;
}) {
  const needed = Math.max(0, 4 - queueCount);

  return (
    <Card className={cn(adminCardClass, "overflow-hidden", className)}>
      <CardHeader className="border-b border-black/5 bg-gradient-to-r from-sisclub-green/8 to-transparent pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-sisclub-green" />
              Next on court
            </CardTitle>
            <CardDescription className="mt-1">
              {nextMatch
                ? nextMatch.isNewbieCourt
                  ? "Newbie court — all four players are first-timers."
                  : nextMatch.recordBracket
                    ? `${recordTierLabel(nextMatch.recordBracket)} — matched by win/loss record.`
                    : "Mixed skill — these four are next if you assign from the queue."
                : needed > 0
                  ? `Need ${needed} more checked-in player${needed === 1 ? "" : "s"} before a match can start.`
                  : "Not enough eligible players in the queue right now."}
            </CardDescription>
          </div>
          <Link href={courtsHref}>
            <Button size="sm" className={adminBtnPrimary}>
              Assign on courts
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {nextMatch ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(["teamA", "teamB"] as const).map((side) => {
              const teams = teamsFromAssignment(nextMatch);
              const players = teams[side];
              const label = side === "teamA" ? "Team A" : "Team B";
              const team = side === "teamA" ? "A" : "B";

              return (
                <div key={side} className="space-y-2">
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      side === "teamA" ? "text-pink-500" : "text-violet-500"
                    )}
                  >
                    {label}
                  </p>
                  <div className="space-y-2">
                    <CourtPlayerChip player={players[0]} team={team} />
                    <CourtPlayerChip player={players[1]} team={team} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-muted/20 px-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {queueCount === 0
                ? "No one is waiting. Check players in from the Check-in tab."
                : `${queueCount} in queue — waiting for ${needed} more to fill a court.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
