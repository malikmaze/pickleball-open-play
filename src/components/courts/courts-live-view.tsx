"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CourtLiveCard } from "@/components/courts/court-live-card";
import {
  createNextMatchForCourt,
  getEligiblePlayers,
  previewNextMatch,
  toQueuePlayer,
  validateMatchScore,
} from "@/lib/queue/queue-engine";
import { createClient } from "@/utils/supabase/client";
import {
  changeCourtSidesRecord,
  clearCourtRecord,
  createMatchRecord,
  fetchSessionBundle,
  finishMatchRecord,
  getActiveMatchForCourt,
  resetCourtAfterMatch,
  startMatchRecord,
  updateMatchScoresRecord,
} from "@/utils/supabase/queries";
import type { Court, Match, SessionBundle } from "@/types";

function queueSettings(session: SessionBundle["session"]) {
  return {
    paymentRequired: session.paymentRequired,
    allowUnpaidInQueue: session.allowUnpaidInQueue,
    skillMatchingMode: session.skillMatchingMode,
  };
}

export function CourtsLiveView({
  sessionId,
  isAdmin,
  showQueue = true,
  header,
}: {
  sessionId: string;
  isAdmin: boolean;
  showQueue?: boolean;
  header?: React.ReactNode;
}) {
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [courtMatches, setCourtMatches] = useState<Record<string, Match | null>>({});
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [winnerFlash, setWinnerFlash] = useState<Record<string, "A" | "B" | null>>({});
  const [busyCourt, setBusyCourt] = useState<string | null>(null);

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
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const session = bundle?.session;
  const courts = bundle?.courts ?? [];

  const queuePlayers = useMemo(() => {
    if (!session) return [];
    return getEligiblePlayers(
      session.players.map((p) => toQueuePlayer(p)),
      queueSettings(session)
    );
  }, [session]);

  const nextPreview = useMemo(() => {
    if (!session) return null;
    const assignment = previewNextMatch(
      session.players.map((p) => toQueuePlayer(p)),
      queueSettings(session)
    );
    if (!assignment) return null;
    const names = assignment.players.map((p) => p.name).join(", ");
    return names;
  }, [session]);

  const finishedByCourt = useMemo(() => {
    const map: Record<string, Match | null> = {};
    if (!bundle) return map;
    for (const court of bundle.courts) {
      map[court.id] =
        bundle.matches.find(
          (m) => m.courtId === court.id && m.status === "finished"
        ) ?? null;
    }
    return map;
  }, [bundle]);

  const handleAssign = async (court: Court) => {
    if (!session) return;
    setBusyCourt(court.id);
    try {
      const supabase = createClient();
      const assignment = createNextMatchForCourt(
        session.players.map((p) => toQueuePlayer(p)),
        queueSettings(session)
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
      setBusyCourt(null);
    }
  };

  const handleStart = async (court: Court, match: Match) => {
    setBusyCourt(court.id);
    try {
      const supabase = createClient();
      await startMatchRecord(supabase, match.id, court.id);
      toast.success("Match started");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Start failed");
    } finally {
      setBusyCourt(null);
    }
  };

  const handleUpdateScore = async (court: Court, match: Match) => {
    const raw = scores[court.id] ?? {
      a: String(match.teamAScore ?? 0),
      b: String(match.teamBScore ?? 0),
    };
    const teamAScore = Number(raw.a);
    const teamBScore = Number(raw.b);
    if (Number.isNaN(teamAScore) || Number.isNaN(teamBScore)) {
      toast.error("Enter valid scores");
      return;
    }
    setBusyCourt(court.id);
    try {
      const supabase = createClient();
      await updateMatchScoresRecord(supabase, match.id, teamAScore, teamBScore);
      toast.success("Score updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyCourt(null);
    }
  };

  const handleEndMatch = async (court: Court, match: Match) => {
    if (!session) return;
    const raw = scores[court.id] ?? {
      a: String(match.teamAScore ?? 0),
      b: String(match.teamBScore ?? 0),
    };
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
    setBusyCourt(court.id);
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
      toast.error(err instanceof Error ? err.message : "End match failed");
    } finally {
      setBusyCourt(null);
    }
  };

  const handleChangeSides = async (court: Court) => {
    setBusyCourt(court.id);
    try {
      const supabase = createClient();
      const updated = await changeCourtSidesRecord(supabase, court, sessionId);
      setBundle((prev) =>
        prev
          ? {
              ...prev,
              courts: prev.courts.map((c) =>
                c.id === court.id ? updated : c
              ),
            }
          : prev
      );
      toast.success(`Court ${court.courtNumber} sides swapped`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Side change failed");
    } finally {
      setBusyCourt(null);
    }
  };

  const handleClear = async (court: Court) => {
    const match = courtMatches[court.id];
    setBusyCourt(court.id);
    try {
      const supabase = createClient();
      const playerIds = match
        ? [
            match.teamAPlayer1Id,
            match.teamAPlayer2Id,
            match.teamBPlayer1Id,
            match.teamBPlayer2Id,
          ]
        : undefined;
      await clearCourtRecord(
        supabase,
        court.id,
        sessionId,
        court.courtNumber,
        match?.id,
        playerIds
      );
      toast.success(`Court ${court.courtNumber} cleared`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setBusyCourt(null);
    }
  };

  if (loading && !bundle) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  if (!session) {
    return (
      <p className="py-12 text-center text-muted-foreground">Session not found.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {header ?? (
          <div>
            <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
              Live Courts
            </h2>
            <p className="text-sm text-muted-foreground">{session.title}</p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => load()}
          className="rounded-full"
          disabled={loading}
        >
          <RefreshCw className={loading ? "mr-1 h-4 w-4 animate-spin" : "mr-1 h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-sisclub-green-dark/15 bg-sisclub-green-dark p-3 text-white shadow-md">
        {[
          { label: "Game to", value: `${session.targetScore}` },
          { label: "Win by", value: `${session.winBy}` },
          { label: "Courts", value: `${session.courtCount}` },
          {
            label: "Auto assign",
            value: session.autoAssignNextMatch ? "ON" : "OFF",
            highlight: session.autoAssignNextMatch,
          },
          {
            label: "Payment",
            value: session.paymentRequired ? "Required" : "No",
          },
          {
            label: "Checked in",
            value: `${session.players.filter((p) => ["Present", "Waiting", "Playing", "Secured"].includes(p.status)).length} / ${session.maxPlayers}`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-[88px] flex-1 flex-col rounded-xl bg-white/10 px-3 py-2"
          >
            <span className="text-[10px] uppercase tracking-wide text-white/60">
              {stat.label}
            </span>
            <span
              className={
                "highlight" in stat && stat.highlight
                  ? "font-semibold text-emerald-300"
                  : "font-semibold"
              }
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {courts.map((court) => {
          const match = courtMatches[court.id];
          const finishedMatch =
            court.status === "Finished" ? finishedByCourt[court.id] : null;
          const score = scores[court.id] ?? {
            a: match?.teamAScore?.toString() ?? "",
            b: match?.teamBScore?.toString() ?? "",
          };

          return (
            <CourtLiveCard
              key={court.id}
              court={court}
              session={session}
              match={match}
              finishedMatch={finishedMatch}
              isAdmin={isAdmin}
              busy={busyCourt === court.id}
              winnerFlash={winnerFlash[court.id] ?? null}
              scoreInput={score}
              nextMatchPreview={
                !match && court.status === "Empty" ? nextPreview ?? undefined : undefined
              }
              onScoreChange={(a, b) =>
                setScores((s) => ({ ...s, [court.id]: { a, b } }))
              }
              onAssign={() => handleAssign(court)}
              onStart={() => match && handleStart(court, match)}
              onUpdateScore={() => match && handleUpdateScore(court, match)}
              onEndMatch={() => match && handleEndMatch(court, match)}
              onChangeSides={() => handleChangeSides(court)}
              onClear={() => handleClear(court)}
            />
          );
        })}
      </div>

      {showQueue && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Queue</CardTitle>
              <span className="rounded-full bg-sisclub-green px-2.5 py-0.5 text-xs font-bold text-white">
                {queuePlayers.length}
              </span>
            </CardHeader>
            <CardContent>
              {queuePlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No players waiting.</p>
              ) : (
                <ol className="max-h-64 space-y-2 overflow-y-auto text-sm">
                  {queuePlayers.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-white/80 px-3 py-2.5 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sisclub-green/15 text-xs font-bold text-sisclub-green-dark">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="rounded-full bg-sisclub-pink-soft px-2 py-0.5 text-[10px] font-semibold text-sisclub-pink-dark">
                        {p.skillLevel}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {bundle?.activity && bundle.activity.length > 0 && (
            <Card className="rounded-3xl border-2 border-black/10">
              <CardHeader>
                <CardTitle className="text-base">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {bundle.activity.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl bg-white/60 px-3 py-2 text-muted-foreground"
                    >
                      {item.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
