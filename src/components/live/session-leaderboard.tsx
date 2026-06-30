"use client";

import { Trophy } from "lucide-react";
import { formatWinLoss, rankTopPlayers } from "@/lib/player-stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";

const rankStyles = [
  "bg-amber-100 text-amber-900 ring-amber-200",
  "bg-slate-100 text-slate-700 ring-slate-200",
  "bg-orange-100 text-orange-900 ring-orange-200",
] as const;

export function SessionLeaderboard({
  players,
  limit = 5,
  className,
}: {
  players: Player[];
  limit?: number;
  className?: string;
}) {
  const standings = rankTopPlayers(players, limit);

  return (
    <Card className={cn("rounded-3xl border-2 border-black/10", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top {limit}
        </CardTitle>
        <CardDescription className="text-xs">
          Ranked by wins, then fewer losses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed matches yet — standings appear after the first results.
          </p>
        ) : (
          <ol className="space-y-2">
            {standings.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1",
                    row.rank <= 3
                      ? rankStyles[row.rank - 1]
                      : "bg-muted text-muted-foreground ring-black/5"
                  )}
                >
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sisclub-green-dark">
                    {row.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.skillLevel} · {row.gamesPlayed} game
                    {row.gamesPlayed === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-sisclub-green-dark">
                    {formatWinLoss(row)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round(row.winRate * 100)}% win
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
