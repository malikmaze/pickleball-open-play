"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  courtRentalUnavailableCopy,
  formatEffectiveCourtRentalWindow,
  getCourtRentalStatus,
} from "@/lib/court-schedule";
import { sanitizeScoreTyping } from "@/lib/numbers";
import { cn } from "@/lib/utils";
import { resolvePlayerCourtGender } from "@/lib/player-gender";
import type { Court, Match, Player, Session } from "@/types";
import {
  CourtScoreboard,
  PickleballCourtView,
} from "./pickleball-court-view";
import { EmptyCourtView } from "./empty-court-view";
import type { NextMatchAssignment } from "@/lib/queue/queue-engine";
import type { CourtPlayerInfo } from "./types";

function playerInfo(
  players: Player[],
  id: string,
  highlightPlayerId?: string
): CourtPlayerInfo {
  const p = players.find((pl) => pl.id === id);
  const name = p?.name ?? "Player";
  return {
    name,
    skill: p?.skillLevel,
    gamesPlayed: p?.gamesPlayed,
    gender: resolvePlayerCourtGender(p?.gender, name),
    isYou: highlightPlayerId === id,
  };
}

const statusColors: Record<Court["status"], string> = {
  Empty: "bg-muted text-muted-foreground",
  Ready: "bg-amber-100 text-amber-800",
  Playing: "bg-sisclub-green/15 text-sisclub-green-dark",
  Finished: "bg-sisclub-pink-soft text-sisclub-pink-dark",
};

export function CourtLiveCard({
  court,
  session,
  match,
  finishedMatch,
  isAdmin,
  busy,
  winnerFlash,
  scoreInput,
  nextMatch,
  queueCount = 0,
  highlightPlayerId,
  onScoreChange,
  onAssign,
  onStart,
  onUpdateScore,
  onEndMatch,
  onChangeSides,
  onClear,
  now = new Date(),
}: {
  court: Court;
  session: Session;
  match: Match | null;
  finishedMatch: Match | null;
  isAdmin: boolean;
  busy: boolean;
  winnerFlash: "A" | "B" | null;
  scoreInput: { a: string; b: string };
  nextMatch?: NextMatchAssignment | null;
  queueCount?: number;
  highlightPlayerId?: string;
  now?: Date;
  onScoreChange: (a: string, b: string) => void;
  onAssign: () => void;
  onStart: () => void;
  onUpdateScore: () => void;
  onEndMatch: () => void;
  onChangeSides: () => void;
  onClear: () => void;
}) {
  const displayMatch = match ?? finishedMatch;
  const teamA: [CourtPlayerInfo, CourtPlayerInfo] = displayMatch
    ? [
        playerInfo(session.players, displayMatch.teamAPlayer1Id, highlightPlayerId),
        playerInfo(session.players, displayMatch.teamAPlayer2Id, highlightPlayerId),
      ]
    : [{ name: "—" }, { name: "—" }];
  const teamB: [CourtPlayerInfo, CourtPlayerInfo] = displayMatch
    ? [
        playerInfo(session.players, displayMatch.teamBPlayer1Id, highlightPlayerId),
        playerInfo(session.players, displayMatch.teamBPlayer2Id, highlightPlayerId),
      ]
    : [{ name: "—" }, { name: "—" }];

  const scoreA =
    match?.teamAScore ??
    (match ? Number(scoreInput.a) || 0 : finishedMatch?.teamAScore ?? 0);
  const scoreB =
    match?.teamBScore ??
    (match ? Number(scoreInput.b) || 0 : finishedMatch?.teamBScore ?? 0);

  const showSideChangeHint =
    session.allowSideChange &&
    match?.status === "playing" &&
    Math.max(scoreA, scoreB) >= session.sideChangePoint &&
    !court.sidesSwapped;

  const rentalStatus = getCourtRentalStatus(court, session, now);
  const isRentalActive = rentalStatus.available;
  const rentalWindow = formatEffectiveCourtRentalWindow(court, session);
  const unavailableCopy = courtRentalUnavailableCopy(rentalStatus);
  const canAssignOrStart = isRentalActive;
  const showCompactUnavailable = !isRentalActive && !displayMatch;
  const showAdminFooter =
    isAdmin && (Boolean(match) || court.status !== "Empty" || isRentalActive);

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl border-2 shadow-lg transition-opacity",
        isRentalActive
          ? "border-pink-200/60 bg-gradient-to-b from-white via-pink-50/30 to-violet-50/40"
          : "border-muted/50 bg-muted/30"
      )}
    >
      <AnimatePresence>
        {winnerFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-sisclub-green/95 text-white"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              <Trophy className="mb-2 h-12 w-12" />
            </motion.div>
            <p className="font-heading text-lg font-bold">
              Court {court.courtNumber} Winner
            </p>
            <p className="text-3xl font-bold">Team {winnerFlash}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="space-y-0 border-b border-black/5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle
              className={cn(
                "font-heading text-lg leading-tight",
                isRentalActive ? "text-pink-600" : "text-muted-foreground"
              )}
            >
              Court {court.courtNumber} ♡
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Rental {rentalWindow}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              isRentalActive
                ? statusColors[court.status]
                : "bg-muted text-muted-foreground"
            )}
          >
            {isRentalActive ? court.status : "Unavailable"}
          </span>
        </div>
        {finishedMatch?.winnerTeam && court.status === "Finished" && !winnerFlash && (
          <p className="mt-2 text-sm font-semibold text-sisclub-green">
            Winner: Team {finishedMatch.winnerTeam}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
        {showCompactUnavailable ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-10 text-center">
            <p className="font-heading text-base font-semibold text-muted-foreground">
              {unavailableCopy}
            </p>
            <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
              This court opens during its rental window above.
            </p>
          </div>
        ) : displayMatch ? (
          <div className="space-y-3 rounded-2xl border border-pink-100/80 bg-gradient-to-br from-pink-50/50 to-violet-50/30 p-3">
            <CourtScoreboard
              teamAScore={scoreA}
              teamBScore={scoreB}
              targetScore={session.targetScore}
              winBy={session.winBy}
              status={match?.status ?? "finished"}
            />
            <PickleballCourtView
              teamA={teamA}
              teamB={teamB}
              sidesSwapped={court.sidesSwapped}
              isPlaying={match?.status === "playing"}
            />
            {showSideChangeHint && (
              <p className="rounded-xl bg-gradient-to-r from-amber-50 to-pink-50 px-3 py-2 text-center text-xs text-pink-700">
                ✨ Side change suggested at {session.sideChangePoint} points
              </p>
            )}
            {court.sidesSwapped && (
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ArrowLeftRight className="h-3 w-3" />
                Sides swapped (teams unchanged)
              </p>
            )}
          </div>
        ) : (
          <EmptyCourtView
            nextMatch={canAssignOrStart ? nextMatch : null}
            queueCount={queueCount}
            targetScore={session.targetScore}
            winBy={session.winBy}
            className="flex-1"
          />
        )}
      </CardContent>

      {showAdminFooter && (
        <CardFooter className="mt-auto flex flex-col gap-2 border-t border-black/5 bg-white/40 pt-4 sm:flex-row sm:flex-wrap">
          {!match && court.status !== "Playing" && (
            <Button
              disabled={busy || !canAssignOrStart}
              onClick={onAssign}
              className="min-h-11 w-full rounded-full bg-sisclub-green hover:bg-sisclub-green-dark sm:w-auto"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign next"}
            </Button>
          )}
          {match?.status === "ready" && (
            <Button
              disabled={busy || !canAssignOrStart}
              onClick={onStart}
              className="min-h-11 w-full rounded-full bg-sisclub-green hover:bg-sisclub-green-dark sm:w-auto"
            >
              Start Match
            </Button>
          )}
          {match?.status === "playing" && (
            <>
              <div className="grid w-full grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Team A</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={scoreInput.a}
                    onChange={(e) =>
                      onScoreChange(
                        sanitizeScoreTyping(e.target.value),
                        scoreInput.b
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Team B</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={scoreInput.b}
                    onChange={(e) =>
                      onScoreChange(
                        scoreInput.a,
                        sanitizeScoreTyping(e.target.value)
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                disabled={busy}
                variant="outline"
                onClick={onUpdateScore}
                className="min-h-11 w-full rounded-full sm:w-auto"
              >
                Update Score
              </Button>
              <Button
                disabled={busy}
                onClick={onEndMatch}
                className="min-h-11 w-full rounded-full bg-sisclub-pink text-white hover:bg-sisclub-pink-dark sm:w-auto"
              >
                End Match
              </Button>
              {session.allowSideChange && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={onChangeSides}
                  className="min-h-11 w-full rounded-full sm:w-auto"
                >
                  <ArrowLeftRight className="mr-1 h-4 w-4" />
                  Change Sides
                </Button>
              )}
            </>
          )}
          {(match || court.status !== "Empty") && (
            <Button
              disabled={busy}
              variant="destructive"
              onClick={onClear}
              className="min-h-11 w-full rounded-full sm:w-auto"
            >
              Clear Court
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
