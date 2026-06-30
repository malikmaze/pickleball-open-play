"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWinLoss } from "@/lib/player-stats";
import { isTestPlayerName } from "@/lib/test-players";
import type { CourtPlayerInfo } from "./types";

const PickleballCourt3D = dynamic(
  () => import("./pickleball-court-3d").then((mod) => mod.PickleballCourt3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    ),
  }
);

export type { CourtPlayerInfo } from "./types";

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function CourtPlayerChip({
  player,
  team,
  compact = false,
}: {
  player: CourtPlayerInfo;
  team: "A" | "B";
  compact?: boolean;
}) {
  const isA = team === "A";
  const isTest = isTestPlayerName(player.name);
  const isFemale = player.gender === "female";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border-2 shadow-sm transition-transform hover:scale-[1.02]",
        compact ? "p-2" : "p-2.5",
        isA
          ? "border-pink-200/80 bg-gradient-to-r from-pink-50 to-rose-50"
          : "border-violet-200/80 bg-gradient-to-r from-violet-50 to-purple-50",
        isTest && "ring-2 ring-amber-200/60",
        player.isYou && "ring-2 ring-sisclub-green shadow-md"
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-md",
            compact ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm",
            isA
              ? "bg-gradient-to-br from-pink-400 to-rose-500"
              : "bg-gradient-to-br from-violet-400 to-purple-500"
          )}
        >
          {initials(player.name)}
        </div>
        {isFemale && (
          <span className="absolute -right-0.5 -top-0.5 text-[10px]">✨</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {player.name}
          {player.isYou && (
            <span className="ml-1.5 text-xs font-semibold text-sisclub-green">
              (you)
            </span>
          )}
          {isTest && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
              demo
            </span>
          )}
        </p>
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-[11px]")}>
          {player.skill ? `${player.skill}` : "—"}
          {player.wins !== undefined && player.losses !== undefined
            ? ` · ${formatWinLoss({ wins: player.wins, losses: player.losses })}`
            : player.gamesPlayed !== undefined
              ? ` · ${player.gamesPlayed} games`
              : ""}
        </p>
      </div>
    </div>
  );
}

export function PickleballCourtView({
  teamA,
  teamB,
  sidesSwapped = false,
  isPlaying = false,
  emptyLabel = "Court view",
  className,
}: {
  teamA: [CourtPlayerInfo, CourtPlayerInfo];
  teamB: [CourtPlayerInfo, CourtPlayerInfo];
  sidesSwapped?: boolean;
  isPlaying?: boolean;
  /** Badge label when the court has no players yet */
  emptyLabel?: string;
  className?: string;
}) {
  const left = sidesSwapped ? teamB : teamA;
  const right = sidesSwapped ? teamA : teamB;
  const leftTeam = sidesSwapped ? "B" : "A";
  const rightTeam = sidesSwapped ? "A" : "B";

  const hasPlayers =
    teamA[0].name !== "—" &&
    teamA[1].name !== "—" &&
    teamB[0].name !== "—" &&
    teamB[1].name !== "—";

  const courtVisual = (
    <div className="relative w-full overflow-hidden rounded-3xl border-2 border-pink-200/60 bg-gradient-to-br from-pink-50/80 via-white to-violet-50/80 shadow-inner">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-pink-500 shadow-sm backdrop-blur">
        <Sparkles className="h-3 w-3" />
        {isPlaying ? "Live rally" : hasPlayers ? "Court view" : emptyLabel}
      </div>
      <div className="aspect-[4/3] min-h-[190px] w-full @min-[28rem]:min-h-[240px]">
        <PickleballCourt3D
          teamA={teamA}
          teamB={teamB}
          sidesSwapped={sidesSwapped}
          isPlaying={isPlaying}
          className="h-full w-full"
        />
      </div>
      <p className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-pink-400/80 px-2.5 py-0.5 text-[9px] font-medium text-white shadow">
        drag to rotate ♡
      </p>
    </div>
  );

  const playerRoster = hasPlayers ? (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 @[34rem]:grid-cols-1 @[34rem]:gap-2">
      <div className="space-y-2">
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-pink-500">
          <Heart className="h-3 w-3 fill-pink-300" />
          Team {leftTeam}
        </p>
        <CourtPlayerChip player={left[0]} team={leftTeam as "A" | "B"} />
        <CourtPlayerChip player={left[1]} team={leftTeam as "A" | "B"} />
      </div>
      <div className="space-y-2">
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-violet-500">
          <Heart className="h-3 w-3 fill-violet-300" />
          Team {rightTeam}
        </p>
        <CourtPlayerChip player={right[0]} team={rightTeam as "A" | "B"} />
        <CourtPlayerChip player={right[1]} team={rightTeam as "A" | "B"} />
      </div>
    </div>
  ) : null;

  return (
    <div className={cn("@container space-y-3", className)}>
      <div className="flex flex-col gap-3 @[34rem]:grid @[34rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] @[34rem]:items-center @[34rem]:gap-3">
        <div className="min-w-0">{courtVisual}</div>
        {playerRoster && <div className="min-w-0">{playerRoster}</div>}
      </div>
    </div>
  );
}

export function CourtScoreboard({
  teamAScore,
  teamBScore,
  targetScore,
  winBy,
  status,
  compact = false,
}: {
  teamAScore: number;
  teamBScore: number;
  targetScore: number;
  winBy: number;
  status: string;
  compact?: boolean;
}) {
  const statusLabel =
    status === "playing"
      ? "LIVE"
      : status === "ready"
        ? "READY"
        : status === "finished"
          ? "FINAL"
          : status.toUpperCase();

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-pink-200/50 bg-white/80 shadow-md backdrop-blur">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <div
          className={cn(
            "flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500 text-white",
            compact ? "px-2 py-2" : "px-3 py-3"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
            Team A
          </span>
          <motion.span
            key={teamAScore}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "font-heading font-bold leading-none drop-shadow",
              compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            )}
          >
            {teamAScore}
          </motion.span>
        </div>

        <div
          className={cn(
            "flex flex-col items-center justify-center border-x border-pink-100 bg-gradient-to-b from-white to-pink-50/50 text-center",
            compact ? "px-2 py-1.5" : "px-3 py-2"
          )}
        >
          <span
            className={cn(
              "mb-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              status === "playing"
                ? "bg-rose-500 text-white shadow-sm"
                : status === "ready"
                  ? "bg-amber-200 text-amber-900"
                  : "bg-pink-100 text-pink-700"
            )}
          >
            {statusLabel}
          </span>
          <span className="text-[10px] font-semibold text-pink-600">
            game to {targetScore}
          </span>
          <span className="text-[10px] text-muted-foreground">win by {winBy}</span>
        </div>

        <div
          className={cn(
            "flex flex-col items-center justify-center bg-gradient-to-br from-violet-400 to-purple-500 text-white",
            compact ? "px-2 py-2" : "px-3 py-3"
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
            Team B
          </span>
          <motion.span
            key={teamBScore}
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "font-heading font-bold leading-none drop-shadow",
              compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            )}
          >
            {teamBScore}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
