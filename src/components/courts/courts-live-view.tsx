"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourtAnnouncementToggle } from "@/components/courts/court-announcement-toggle";
import { ActivityFeed } from "@/components/live/activity-feed";
import { QueuePanel } from "@/components/live/queue-panel";
import { WinnerHistory } from "@/components/live/winner-history";
import { LiveSessionHeader } from "@/components/live/live-session-header";
import { CourtLiveCard } from "@/components/courts/court-live-card";
import { CourtSessionStats } from "@/components/courts/court-session-stats";
import {
  createNextMatchForCourt,
  getEligiblePlayers,
  previewNextMatch,
  toQueuePlayer,
  validateMatchScore,
} from "@/lib/queue/queue-engine";
import {
  courtRentalUnavailableCopy,
  getCourtRentalStatus,
  isCourtRentalActive,
} from "@/lib/court-schedule";
import { getQueueSessionSettings } from "@/lib/sessions";
import {
  announceCourtCall,
  isCourtAnnouncementsEnabled,
} from "@/lib/court-announcement";
import { useCourtAnnouncements } from "@/hooks/use-court-announcements";
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
import { cn } from "@/lib/utils";

function queueSettings(session: SessionBundle["session"]) {
  return getQueueSessionSettings(session);
}

function courtGridClasses(hasSidebar: boolean, courtCount: number) {
  return cn(
    "grid items-stretch gap-4 sm:gap-5",
    hasSidebar
      ? "grid-cols-1 lg:grid-cols-2"
      : cn(
          "grid-cols-1 md:grid-cols-2",
          courtCount >= 3 && "xl:grid-cols-3"
        )
  );
}

export function CourtsLiveView({
  sessionId,
  isAdmin,
  showQueue = true,
  showSidePanels = false,
  highlightPlayerId,
  header,
}: {
  sessionId: string;
  isAdmin: boolean;
  showQueue?: boolean;
  showSidePanels?: boolean;
  highlightPlayerId?: string;
  header?: React.ReactNode;
}) {
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [courtMatches, setCourtMatches] = useState<Record<string, Match | null>>({});
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [winnerFlash, setWinnerFlash] = useState<Record<string, "A" | "B" | null>>({});
  const [busyCourt, setBusyCourt] = useState<string | null>(null);
  const [announcementsOn, setAnnouncementsOn] = useState(() =>
    isCourtAnnouncementsEnabled()
  );
  const skipNextCourtPollAnnounce = useRef(false);
  const [now, setNow] = useState(() => new Date());

  useCourtAnnouncements(
    bundle?.activityLogs,
    announcementsOn,
    skipNextCourtPollAnnounce
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling live session data
    void load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const session = bundle?.session;
  const courts = bundle?.courts ?? [];

  const queuePlayers = useMemo(() => {
    if (!session) return [];
    return getEligiblePlayers(session.players.map((p) => toQueuePlayer(p)));
  }, [session]);

  const nextAssignment = useMemo(() => {
    if (!session) return null;
    return previewNextMatch(queuePlayers, queueSettings(session));
  }, [session, queuePlayers]);

  const nextUpPlayerIds = useMemo(
    () => new Set(nextAssignment?.players.map((p) => p.id) ?? []),
    [nextAssignment]
  );

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
    const rentalStatus = getCourtRentalStatus(court, session, now);
    if (!rentalStatus.available) {
      toast.error(courtRentalUnavailableCopy(rentalStatus));
      return;
    }
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
      toast.success(`Next match assigned to Court ${court.courtNumber}`);

      if (isCourtAnnouncementsEnabled()) {
        announceCourtCall({
          courtNumber: court.courtNumber,
          teamA: [a1.name, a2.name],
          teamB: [b1.name, b2.name],
        });
        skipNextCourtPollAnnounce.current = true;
      }

      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusyCourt(null);
    }
  };

  const handleStart = async (court: Court, match: Match) => {
    if (!session) return;
    const rentalStatus = getCourtRentalStatus(court, session, now);
    if (!rentalStatus.available) {
      toast.error(courtRentalUnavailableCopy(rentalStatus));
      return;
    }
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
        const autoMatch =
          isCourtRentalActive(court, session, now)
            ? await resetCourtAfterMatch(supabase, court.id, session)
            : null;
        setWinnerFlash((prev) => ({ ...prev, [court.id]: null }));
        if (autoMatch) {
          toast.success(
            `Next match auto-assigned on Court ${court.courtNumber}`
          );
        }
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
      const autoMatch = await clearCourtRecord(
        supabase,
        court.id,
        sessionId,
        court.courtNumber,
        match?.id,
        playerIds,
        session && isCourtRentalActive(court, session, now) ? session : undefined
      );
      if (autoMatch) {
        toast.success(
          `Court ${court.courtNumber} cleared · next match assigned`
        );
      } else {
        toast.success(`Court ${court.courtNumber} cleared`);
      }
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

  const hasSidebar = showQueue || showSidePanels;
  const activityLogs = bundle?.activityLogs ?? [];
  const queuePanel = (
    <QueuePanel
      players={queuePlayers}
      highlightPlayerId={highlightPlayerId}
      nextUpPlayerIds={nextUpPlayerIds}
    />
  );

  return (
    <div className="space-y-5">
      {!showSidePanels ? (
        <section className="overflow-hidden rounded-3xl border-2 border-black/10 bg-white shadow-sm">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
            <div className="min-w-0 flex-1">
              {header ?? (
                <>
                  <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
                    Live Courts
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {session.title}
                  </p>
                </>
              )}
            </div>
            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
              <CourtAnnouncementToggle
                onEnabledChange={setAnnouncementsOn}
              />
              <Button
                variant="outline"
                onClick={() => load()}
                className="flex-1 rounded-full sm:flex-none"
                disabled={loading}
              >
                <RefreshCw
                  className={
                    loading ? "mr-1.5 h-4 w-4 animate-spin" : "mr-1.5 h-4 w-4"
                  }
                />
                Refresh
              </Button>
            </div>
          </div>
          <CourtSessionStats
            flush
            stats={[
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
            ]}
          />
        </section>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {header ?? (
              showSidePanels && session ? (
                <LiveSessionHeader session={session} />
              ) : (
                <>
                  <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
                    Live Courts
                  </h2>
                  <p className="text-sm text-muted-foreground">{session.title}</p>
                </>
              )
            )}
          </div>
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
            <CourtAnnouncementToggle onEnabledChange={setAnnouncementsOn} />
            <Button
              variant="outline"
              onClick={() => load()}
              className="flex-1 rounded-full sm:flex-none"
              disabled={loading}
            >
              <RefreshCw
                className={
                  loading ? "mr-1.5 h-4 w-4 animate-spin" : "mr-1.5 h-4 w-4"
                }
              />
              Refresh
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          hasSidebar &&
            "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,22rem)] lg:items-start lg:gap-5 xl:gap-6"
        )}
      >
        <div className="min-w-0 space-y-5">
          <div className={courtGridClasses(hasSidebar, courts.length)}>
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
                  nextMatch={
                    !match &&
                    court.status === "Empty" &&
                    isCourtRentalActive(court, session, now)
                      ? nextAssignment
                      : undefined
                  }
                  queueCount={queuePlayers.length}
                  highlightPlayerId={highlightPlayerId}
                  now={now}
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

          {hasSidebar && (
            <div className="space-y-4 lg:hidden">
              {queuePanel}
              {showSidePanels && bundle && (
                <>
                  <WinnerHistory
                    session={session}
                    courts={bundle.courts}
                    matches={bundle.matches}
                  />
                  {activityLogs.length > 0 && (
                    <ActivityFeed logs={activityLogs} />
                  )}
                </>
              )}
              {!showSidePanels && activityLogs.length > 0 && (
                <ActivityFeed logs={activityLogs} />
              )}
            </div>
          )}
        </div>

        {hasSidebar && (
          <aside className="hidden space-y-4 lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pb-4">
            {queuePanel}
            {showSidePanels && bundle && (
              <>
                <WinnerHistory
                  session={session}
                  courts={bundle.courts}
                  matches={bundle.matches}
                />
                {activityLogs.length > 0 && (
                  <ActivityFeed logs={activityLogs} />
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {hasSidebar && !showSidePanels && activityLogs.length > 0 && (
        <div className="hidden lg:block">
          <ActivityFeed logs={activityLogs} />
        </div>
      )}
    </div>
  );
}
