"use client";

import type { QueuePlayer } from "@/lib/queue/queue-engine";
import { formatWaitingTime } from "@/lib/queue/wait-time";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function QueuePanel({ players }: { players: QueuePlayer[] }) {
  return (
    <Card className="rounded-3xl border-2 border-black/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Queue</CardTitle>
        <span className="rounded-full bg-sisclub-green px-2.5 py-0.5 text-xs font-bold text-white">
          {players.length}
        </span>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players waiting.</p>
        ) : (
          <ol className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {players.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-black/5 bg-white/80 px-3 py-2.5 shadow-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sisclub-green/15 text-xs font-bold text-sisclub-green-dark">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">{p.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {p.gamesPlayed}g · {formatWaitingTime(p)}
                  </span>
                  <span className="rounded-full bg-sisclub-pink-soft px-2 py-0.5 text-[10px] font-semibold text-sisclub-pink-dark">
                    {p.skillLevel}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
