"use client";

import type { Court, Match, Session } from "@/types";
import {
  courtNumberForMatch,
  formatMatchDuration,
  formatMatchScore,
  formatTeamNames,
} from "@/lib/match-format";
import { formatExactTime } from "@/lib/activity-log";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WinnerHistory({
  session,
  courts,
  matches,
}: {
  session: Session;
  courts: Court[];
  matches: Match[];
}) {
  const finished = matches
    .filter((m) => m.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.finishedAt ?? b.createdAt).getTime() -
        new Date(a.finishedAt ?? a.createdAt).getTime()
    );

  if (finished.length === 0) {
    return (
      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader>
          <CardTitle className="text-base">Winner History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No completed matches yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-2 border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Winner History</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="max-h-96 space-y-3 overflow-y-auto">
          {finished.map((match) => {
            const courtNum = courtNumberForMatch(session, courts, match);
            const winners =
              match.winnerTeam === "A"
                ? formatTeamNames(
                    session.players,
                    match.teamAPlayer1Id,
                    match.teamAPlayer2Id
                  )
                : formatTeamNames(
                    session.players,
                    match.teamBPlayer1Id,
                    match.teamBPlayer2Id
                  );
            const losers =
              match.winnerTeam === "A"
                ? formatTeamNames(
                    session.players,
                    match.teamBPlayer1Id,
                    match.teamBPlayer2Id
                  )
                : formatTeamNames(
                    session.players,
                    match.teamAPlayer1Id,
                    match.teamAPlayer2Id
                  );
            const duration = formatMatchDuration(match);

            return (
              <li
                key={match.id}
                className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-bold text-amber-900">
                  🏆 Court {courtNum} Winner
                </p>
                <p className="mt-1 font-semibold text-sisclub-green-dark">
                  {winners}
                </p>
                <p className="text-xs text-muted-foreground">def.</p>
                <p className="text-sm text-foreground/80">{losers}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-sisclub-green-dark">
                    {formatMatchScore(match)}
                  </span>
                  {match.finishedAt && (
                    <span>Completed {formatExactTime(match.finishedAt)}</span>
                  )}
                  {duration && <span>· {duration}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
