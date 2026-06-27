"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { PageShell } from "@/components/page-shell";
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
import { createNextMatchForCourt, toQueuePlayer, validateMatchScore } from "@/lib/queue/queue-engine";
import { createClient } from "@/utils/supabase/client";
import {
  createMatchRecord,
  fetchSessionBundle,
  finishMatchRecord,
  getActiveMatchForCourt,
  resetCourtAfterMatch,
  startMatchRecord,
} from "@/utils/supabase/queries";
import type { Court, Match, Player, SessionBundle } from "@/types";
import { Suspense } from "react";

function playerName(players: Player[], id: string) {
  return players.find((p) => p.id === id)?.name ?? "Player";
}

function CourtsContent({ sessionId }: { sessionId: string }) {
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [courtMatches, setCourtMatches] = useState<Record<string, Match | null>>({});
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [winnerFlash, setWinnerFlash] = useState<Record<string, "A" | "B" | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
      if (data) {
        const matches: Record<string, Match | null> = {};
        for (const court of data.courts) {
          matches[court.id] = await getActiveMatchForCourt(supabase, court.id);
        }
        setCourtMatches(matches);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load courts");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const data = await fetchSessionBundle(supabase, sessionId);
        if (!cancelled) {
          setBundle(data);
          if (data) {
            const matches: Record<string, Match | null> = {};
            for (const court of data.courts) {
              matches[court.id] = await getActiveMatchForCourt(supabase, court.id);
            }
            setCourtMatches(matches);
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load courts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const session = bundle?.session;
  const courts = bundle?.courts ?? [];

  const handleAssign = async (court: Court) => {
    if (!session) return;
    setBusy(court.id);
    try {
      const supabase = createClient();
      const assignment = createNextMatchForCourt(
        session.players.map((p) => toQueuePlayer(p)),
        {
          paymentRequired: session.paymentRequired,
          allowUnpaidInQueue: session.allowUnpaidInQueue,
        }
      );
      if (!assignment) {
        toast.error("Not enough eligible players in queue");
        return;
      }
      const [a1, a2] = assignment.teams.teamA;
      const [b1, b2] = assignment.teams.teamB;
      const match = await createMatchRecord(supabase, {
        sessionId,
        courtId: court.id,
        teamAPlayer1Id: a1.id,
        teamAPlayer2Id: a2.id,
        teamBPlayer1Id: b1.id,
        teamBPlayer2Id: b2.id,
      });
      setCourtMatches((prev) => ({ ...prev, [court.id]: match }));
      toast.success(`Match assigned to Court ${court.courtNumber}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(null);
    }
  };

  const handleStart = async (court: Court, match: Match) => {
    setBusy(court.id);
    try {
      const supabase = createClient();
      await startMatchRecord(supabase, match.id, court.id);
      toast.success("Match started");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Start failed");
    } finally {
      setBusy(null);
    }
  };

  const handleScore = async (court: Court, match: Match) => {
    if (!session) return;
    const raw = scores[court.id] ?? { a: "", b: "" };
    const teamAScore = Number(raw.a);
    const teamBScore = Number(raw.b);
    const result = validateMatchScore(
      teamAScore,
      teamBScore,
      session.targetScore,
      session.winBy
    );
    if (!result.valid || !result.winner) {
      toast.error(result.error ?? "Invalid score");
      return;
    }
    setBusy(court.id);
    try {
      const supabase = createClient();
      const playerIds = [
        match.teamAPlayer1Id,
        match.teamAPlayer2Id,
        match.teamBPlayer1Id,
        match.teamBPlayer2Id,
      ];
      await finishMatchRecord(
        supabase,
        match.id,
        court.id,
        teamAScore,
        teamBScore,
        result.winner,
        playerIds
      );
      setWinnerFlash((prev) => ({ ...prev, [court.id]: result.winner! }));
      toast.success(`Court ${court.courtNumber} winner: Team ${result.winner}`);
      setTimeout(async () => {
        const supabase = createClient();
        await resetCourtAfterMatch(supabase, court.id);
        setWinnerFlash((prev) => ({ ...prev, [court.id]: null }));
        await load();
      }, 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Score failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
          Courts · {session.title}
        </h2>
        <Button variant="outline" onClick={() => load()} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>
      <SessionAdminTabs sessionId={sessionId} />
      <div className="grid gap-4 md:grid-cols-2">
        {courts.map((court) => {
          const match = courtMatches[court.id];
          const flash = winnerFlash[court.id];
          const score = scores[court.id] ?? { a: "", b: "" };

          return (
            <Card key={court.id} className="relative overflow-hidden rounded-3xl border-2 border-black/10">
              <AnimatePresence>
                {flash && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-sisclub-green/95 text-white"
                  >
                    <Trophy className="mb-2 h-10 w-10" />
                    <p className="font-heading text-xl font-bold">
                      Court {court.courtNumber} Winner
                    </p>
                    <p className="text-2xl font-bold">Team {flash}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <CardHeader>
                <CardTitle>Court {court.courtNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">Status: {court.status}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {match ? (
                  <>
                    <div className="rounded-2xl bg-sisclub-pink-soft/50 p-3">
                      <p className="font-semibold">Team A</p>
                      <p>{playerName(session.players, match.teamAPlayer1Id)}</p>
                      <p>{playerName(session.players, match.teamAPlayer2Id)}</p>
                    </div>
                    <div className="rounded-2xl bg-sisclub-green/10 p-3">
                      <p className="font-semibold">Team B</p>
                      <p>{playerName(session.players, match.teamBPlayer1Id)}</p>
                      <p>{playerName(session.players, match.teamBPlayer2Id)}</p>
                    </div>
                    {match.status === "playing" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Team A score</Label>
                          <Input
                            type="number"
                            value={score.a}
                            onChange={(e) =>
                              setScores((s) => ({
                                ...s,
                                [court.id]: { ...score, a: e.target.value },
                              }))
                            }
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <Label>Team B score</Label>
                          <Input
                            type="number"
                            value={score.b}
                            onChange={(e) =>
                              setScores((s) => ({
                                ...s,
                                [court.id]: { ...score, b: e.target.value },
                              }))
                            }
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No match assigned.</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {!match && court.status === "Empty" && (
                  <Button
                    disabled={busy === court.id}
                    onClick={() => handleAssign(court)}
                    className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
                  >
                    Assign Next Match
                  </Button>
                )}
                {match?.status === "ready" && (
                  <Button
                    disabled={busy === court.id}
                    onClick={() => handleStart(court, match)}
                    className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
                  >
                    Start Match
                  </Button>
                )}
                {match?.status === "playing" && (
                  <Button
                    disabled={busy === court.id}
                    onClick={() => handleScore(court, match)}
                    className="rounded-full bg-sisclub-pink text-white hover:bg-sisclub-pink-dark"
                  >
                    Record Score
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default function CourtsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  return (
    <PageShell>
      <AppHeader subtitle="Court management" backHref="/admin" />
      <div className="py-6">
        {sessionId ? (
          <Suspense>
            <CourtsContent sessionId={sessionId} />
          </Suspense>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        )}
      </div>
    </PageShell>
  );
}
