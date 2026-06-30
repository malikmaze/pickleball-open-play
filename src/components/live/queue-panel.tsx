"use client";

import { useState, type ReactNode } from "react";
import type { QueuePlayer } from "@/lib/queue/queue-engine";
import { countNewbiesInQueue, isNewbiePlayer } from "@/lib/queue/queue-engine";
import { groupAdjacentQueuePartners } from "@/lib/player-partners";
import { formatWinLoss } from "@/lib/player-stats";
import { formatWaitingTime } from "@/lib/queue/wait-time";
import { cn } from "@/lib/utils";
import { BulkSelectBar } from "@/components/admin/bulk-select-bar";
import { adminQueuePanelHeight } from "@/components/admin/admin-partner-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PartnerQueueGroup } from "./partner-queue-connector";
import { PartnerQueueLegend } from "./partner-queue-legend";

function QueueRow({
  player,
  position,
  highlightPlayerId,
  onRemove,
  isNextUp,
  selectable,
  selected,
  onToggleSelect,
}: {
  player: QueuePlayer;
  position: number;
  highlightPlayerId?: string;
  onRemove?: (playerId: string) => void;
  isNextUp?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (playerId: string) => void;
}) {
  const highlighted = player.id === highlightPlayerId;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-sm",
        isNextUp
          ? "border-amber-300/80 bg-amber-50/90 ring-1 ring-amber-200/80"
          : highlighted
            ? "border-sisclub-green/50 bg-sisclub-green/10 ring-2 ring-sisclub-green/30"
            : "border-black/5 bg-white/80"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {selectable && (
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-sisclub-green"
            checked={selected}
            onChange={() => onToggleSelect?.(player.id)}
          />
        )}
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isNextUp
              ? "bg-amber-500 text-white"
              : highlighted
                ? "bg-sisclub-green text-white"
                : "bg-sisclub-green/15 text-sisclub-green-dark"
          )}
        >
          {position}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {player.name}
            {highlighted && (
              <span className="ml-1.5 text-xs font-semibold text-sisclub-green">
                (you)
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {player.gamesPlayed}g · {formatWinLoss(player)} · {formatWaitingTime(player)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {isNextUp && (
          <span className="hidden rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 sm:inline">
            Next up
          </span>
        )}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isNewbiePlayer(player)
              ? "bg-sky-100 text-sky-800"
              : "bg-sisclub-pink-soft text-sisclub-pink-dark"
          )}
        >
          {player.skillLevel}
        </span>
        {onRemove && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemove(player.id)}
          >
            Remove
          </Button>
        )}
      </span>
    </div>
  );
}

export function QueuePanel({
  players,
  highlightPlayerId,
  onRemovePlayer,
  onBulkRemovePlayers,
  bulkRemoveLoading,
  nextUpPlayerIds,
  headerAction,
  emptyAction,
  className,
  fillHeight = false,
}: {
  players: QueuePlayer[];
  highlightPlayerId?: string;
  onRemovePlayer?: (playerId: string) => void;
  onBulkRemovePlayers?: (playerIds: string[]) => void;
  bulkRemoveLoading?: boolean;
  nextUpPlayerIds?: ReadonlySet<string>;
  headerAction?: ReactNode;
  emptyAction?: ReactNode;
  className?: string;
  /** Fixed-height card with a scrollable list (Queue admin tab). */
  fillHeight?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const groups = groupAdjacentQueuePartners(players);
  const hasPartnerPairs = groups.some((group) => group.kind === "pair");
  const newbieCount = countNewbiesInQueue(players);
  const bulkSelect = !!onBulkRemovePlayers;
  const selectableIds = players.map((p) => p.id);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(selectableIds) : new Set());
  };

  return (
    <Card
      className={cn(
        "rounded-3xl border-2 border-black/10",
        fillHeight && cn("flex flex-col", adminQueuePanelHeight),
        className
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription className="mt-0.5 text-xs">
            Fair order by games played and wait time since check-in.
            {newbieCount > 0 && (
              <>
                {" "}
                · {newbieCount} Newbie{newbieCount === 1 ? "" : "s"} waiting
                {newbieCount >= 4 ? " (next court is newbie-only)" : ""}
              </>
            )}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerAction}
          <span className="rounded-full bg-sisclub-green px-2.5 py-0.5 text-xs font-bold text-white">
            {players.length}
          </span>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-3",
          fillHeight && "flex min-h-0 flex-1 flex-col"
        )}
      >
        {hasPartnerPairs && <PartnerQueueLegend />}

        {bulkSelect && players.length > 0 && (
          <BulkSelectBar
            selectedCount={selected.size}
            totalSelectable={selectableIds.length}
            onSelectAll={handleSelectAll}
            onClear={() => setSelected(new Set())}
            onRemove={() => onBulkRemovePlayers?.([...selected])}
            removeLoading={bulkRemoveLoading}
          />
        )}

        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No players waiting.</p>
            {emptyAction && <div className="mt-2 text-sm">{emptyAction}</div>}
          </div>
        ) : (
          <ol
            className={cn(
              "space-y-2 text-sm",
              fillHeight
                ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
                : "max-h-[min(50vh,480px)] overflow-y-auto xl:max-h-[min(62vh,560px)]"
            )}
          >
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
                      onRemove={onRemovePlayer}
                      isNextUp={nextUpPlayerIds?.has(first.id)}
                      selectable={bulkSelect}
                      selected={selected.has(first.id)}
                      onToggleSelect={toggleSelected}
                    />
                    <QueueRow
                      player={second}
                      position={group.startIndex + 2}
                      highlightPlayerId={highlightPlayerId}
                      onRemove={onRemovePlayer}
                      isNextUp={nextUpPlayerIds?.has(second.id)}
                      selectable={bulkSelect}
                      selected={selected.has(second.id)}
                      onToggleSelect={toggleSelected}
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
                    onRemove={onRemovePlayer}
                    isNextUp={nextUpPlayerIds?.has(group.player.id)}
                    selectable={bulkSelect}
                    selected={selected.has(group.player.id)}
                    onToggleSelect={toggleSelected}
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
