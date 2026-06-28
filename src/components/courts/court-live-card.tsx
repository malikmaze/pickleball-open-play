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
import { cn } from "@/lib/utils";
import { getPlayerGender } from "@/lib/player-gender";
import type { Court, Match, Player, Session } from "@/types";
import {
  CourtScoreboard,
  PickleballCourtView,
} from "./pickleball-court-view";
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
    gender: getPlayerGender(name),
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
  nextMatchPreview,
  highlightPlayerId,
  onScoreChange,
  onAssign,
  onStart,
  onUpdateScore,
  onEndMatch,
  onChangeSides,
  onClear,
}: {
  court: Court;
  session: Session;
  match: Match | null;
  finishedMatch: Match | null;
  isAdmin: boolean;
  busy: boolean;
  winnerFlash: "A" | "B" | null;
  scoreInput: { a: string; b: string };
  nextMatchPreview?: string;
  highlightPlayerId?: string;
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

  return (
    <Card className="relative overflow-hidden rounded-3xl border-2 border-pink-200/60 bg-gradient-to-b from-white via-pink-50/30 to-violet-50/40 shadow-lg">
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

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-heading text-lg text-pink-600">
            Court {court.courtNumber} ♡
          </CardTitle>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              statusColors[court.status]
            )}
          >
            {court.status}
          </span>
        </div>
        {finishedMatch?.winnerTeam && court.status === "Finished" && !winnerFlash && (
          <p className="text-sm font-semibold text-sisclub-green">
            Winner: Team {finishedMatch.winnerTeam}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        {displayMatch ? (
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
          <div className="overflow-hidden rounded-2xl border-2 border-dashed border-sisclub-green/30">
            <PickleballCourtView
              teamA={[{ name: "—" }, { name: "—" }]}
              teamB={[{ name: "—" }, { name: "—" }]}
            />
            <p className="py-3 text-center text-sm text-muted-foreground">
              Waiting for next match
            </p>
          </div>
        )}

        {nextMatchPreview && (
          <div className="rounded-2xl bg-sisclub-pink-soft/40 px-3 py-2 text-xs">
            <p className="font-semibold text-sisclub-pink-dark">Next up</p>
            <p className="text-muted-foreground">{nextMatchPreview}</p>
          </div>
        )}
      </CardContent>

      {isAdmin && (
        <CardFooter className="flex flex-wrap gap-2 border-t border-black/5 pt-4">
          {!match && court.status !== "Playing" && (
            <Button
              disabled={busy}
              onClick={onAssign}
              className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Next Match"}
            </Button>
          )}
          {match?.status === "ready" && (
            <Button
              disabled={busy}
              onClick={onStart}
              className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
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
                    type="number"
                    min={0}
                    value={scoreInput.a}
                    onChange={(e) =>
                      onScoreChange(e.target.value, scoreInput.b)
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Team B</Label>
                  <Input
                    type="number"
                    min={0}
                    value={scoreInput.b}
                    onChange={(e) =>
                      onScoreChange(scoreInput.a, e.target.value)
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                disabled={busy}
                variant="outline"
                onClick={onUpdateScore}
                className="rounded-full"
              >
                Update Score
              </Button>
              <Button
                disabled={busy}
                onClick={onEndMatch}
                className="rounded-full bg-sisclub-pink text-white hover:bg-sisclub-pink-dark"
              >
                End Match
              </Button>
              {session.allowSideChange && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={onChangeSides}
                  className="rounded-full"
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
              className="rounded-full"
            >
              Clear Court
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
