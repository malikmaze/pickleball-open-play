"use client";

import type { QueuePlayer } from "@/lib/queue/queue-engine";
import { groupAdjacentQueuePartners } from "@/lib/player-partners";
import { formatWaitingTime } from "@/lib/queue/wait-time";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PartnerQueueGroup } from "./partner-queue-connector";

function QueueRow({
  player,
  position,
  highlightPlayerId,
}: {
  player: QueuePlayer;
  position: number;
  highlightPlayerId?: string;
}) {
  const highlighted = player.id === highlightPlayerId;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-sm",
        highlighted
          ? "border-sisclub-green/50 bg-sisclub-green/10 ring-2 ring-sisclub-green/30"
          : "border-black/5 bg-white/80"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            highlighted
              ? "bg-sisclub-green text-white"
              : "bg-sisclub-green/15 text-sisclub-green-dark"
          )}
        >
          {position}
        </span>
        <span className="truncate font-medium">
          {player.name}
          {highlighted && (
            <span className="ml-1.5 text-xs font-semibold text-sisclub-green">
              (you)
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {player.gamesPlayed}g · {formatWaitingTime(player)}
        </span>
        <span className="rounded-full bg-sisclub-pink-soft px-2 py-0.5 text-[10px] font-semibold text-sisclub-pink-dark">
          {player.skillLevel}
        </span>
      </span>
    </div>
  );
}

export function QueuePanel({
  players,
  highlightPlayerId,
  partnerPool,
}: {
  players: QueuePlayer[];
  highlightPlayerId?: string;
  /** Session players used to resolve partner links (from Queue tab links). */
  partnerPool?: Pick<Player, "id" | "name" | "partnerId">[];
}) {
  const groups = groupAdjacentQueuePartners(players);

  return (
    <Card className="rounded-3xl border-2 border-black/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Queue</CardTitle>
          {partnerPool && partnerPool.length > 0 && (
            <CardDescription className="mt-0.5 text-xs">
              Fair order by games played and wait time. Linked partners move down
              to wait together and play on the same team.
            </CardDescription>
          )}
        </div>
        <span className="rounded-full bg-sisclub-green px-2.5 py-0.5 text-xs font-bold text-white">
          {players.length}
        </span>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players waiting.</p>
        ) : (
          <ol className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {groups.map((group) => {
              if (group.kind === "pair") {
                const [first, second] = group.players;
                return (
                  <li key={`${first.id}-${second.id}`} className="list-none">
                    <PartnerQueueGroup>
                    <QueueRow
                      player={first}
                      position={group.startIndex + 1}
                      highlightPlayerId={highlightPlayerId}
                    />
                    <QueueRow
                      player={second}
                      position={group.startIndex + 2}
                      highlightPlayerId={highlightPlayerId}
                    />
                    </PartnerQueueGroup>
                  </li>
                );
              }

              return (
                <li key={group.player.id}>
                  <QueueRow
                    player={group.player}
                    position={group.index + 1}
                    highlightPlayerId={highlightPlayerId}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
