"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Radio, Search } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getJoinedPlayerId,
  removeJoinedPlayerId,
  setJoinedPlayerId,
} from "@/hooks/use-player-profile";
import { getPlayerProfile } from "@/lib/player-profile";
import { findPlayerCourt, getGuestStatusHint } from "@/lib/guest-status";
import { canPlayerWithdrawRegistration } from "@/lib/player-permissions";
import { getQueuePosition, toQueuePlayer } from "@/lib/queue/queue-engine";
import { getWaitlistPosition } from "@/lib/waitlist";
import { createClient } from "@/utils/supabase/client";
import {
  fetchSessionBundle,
  findPlayerByContactInSession,
  leaveSessionRecord,
} from "@/utils/supabase/queries";
import type { SessionBundle } from "@/types";

function SessionStatusContent({ sessionId }: { sessionId: string }) {
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [recoverContact, setRecoverContact] = useState(
    () => getPlayerProfile()?.contactNumber ?? ""
  );
  const [recovering, setRecovering] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [playerRevision, setPlayerRevision] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling session status
    void load();
    const interval = setInterval(() => void load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    const contact = recoverContact.trim();
    if (!contact) {
      toast.error("Enter the contact number you used when joining");
      return;
    }

    setRecovering(true);
    try {
      const supabase = createClient();
      const playerId = await findPlayerByContactInSession(
        supabase,
        sessionId,
        contact
      );
      if (!playerId) {
        toast.error("No registration found with that contact number");
        return;
      }
      setJoinedPlayerId(sessionId, playerId);
      setPlayerRevision((n) => n + 1);
      setShowRecovery(false);
      toast.success("Found your registration!");
      await load(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not look up registration"
      );
    } finally {
      setRecovering(false);
    }
  };

  const handleLeave = async () => {
    const myPlayerId = getJoinedPlayerId(sessionId);
    if (!myPlayerId || !bundle) return;

    const myPlayer = bundle.session.players.find((p) => p.id === myPlayerId);
    if (
      myPlayer &&
      !canPlayerWithdrawRegistration(myPlayer.status)
    ) {
      toast.error(
        "You can't leave after check-in. Ask the organizer to remove you."
      );
      return;
    }

    setLeaving(true);
    try {
      const supabase = createClient();
      await leaveSessionRecord(supabase, myPlayerId, sessionId);
      removeJoinedPlayerId(sessionId);
      setPlayerRevision((n) => n + 1);
      toast.success(
        myPlayer?.status === "Waitlisted"
          ? "You've left the waitlist"
          : "You've left the session"
      );
      await load(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to leave session"
      );
    } finally {
      setLeaving(false);
    }
  };

  if (loading && !bundle) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
        <p className="text-sm text-destructive">Session not found</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm font-semibold text-sisclub-green underline-offset-2 hover:underline"
        >
          Back to schedule
        </Link>
      </div>
    );
  }

  const session = bundle.session;
  void playerRevision;
  const myPlayerId = getJoinedPlayerId(sessionId);
  const myPlayer = session.players.find((p) => p.id === myPlayerId);
  const queuePlayers = session.players.map((p) => toQueuePlayer(p));
  const queuePosition =
    myPlayer && myPlayer.status !== "Waitlisted"
      ? getQueuePosition(queuePlayers, myPlayer.id, {
          paymentRequired: session.paymentRequired,
          allowUnpaidInQueue: session.allowUnpaidInQueue,
          skillMatchingMode: session.skillMatchingMode,
        })
      : null;
  const waitlistPosition = myPlayer
    ? getWaitlistPosition(session.players, myPlayer.id)
    : null;
  const courtNumber = myPlayer
    ? findPlayerCourt(session, myPlayer.id, bundle.matches, bundle.courts)
    : null;
  const statusHint = myPlayer
    ? getGuestStatusHint(
        myPlayer,
        session,
        queuePosition,
        waitlistPosition,
        courtNumber
      )
    : null;
  const canLeave =
    myPlayer &&
    session.status !== "closed" &&
    canPlayerWithdrawRegistration(myPlayer.status);

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader>
          <CardTitle className="font-heading text-sisclub-green-dark">
            {session.title}
          </CardTitle>
          <CardDescription>
            {session.startTime} – {session.endTime} · {session.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Courts available: {session.courtCount}</p>
          <p>Scoring: first to {session.targetScore}, win by {session.winBy}</p>
          {session.paymentRequired ? (
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
              <p className="font-semibold">Payment required</p>
              {session.paymentAmount && <p>Amount: ₱{session.paymentAmount}</p>}
              {session.paymentNote && <p>{session.paymentNote}</p>}
              {session.paymentInstructions && (
                <p className="mt-1">{session.paymentInstructions}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No payment required.</p>
          )}
        </CardContent>
      </Card>

      {myPlayer ? (
        <Card className="rounded-3xl border-2 border-sisclub-green/30 bg-gradient-to-b from-white to-sisclub-green/5">
          <CardHeader>
            <CardTitle>Your spot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{myPlayer.name}</span>
              <PlayerStatusBadge status={myPlayer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Skill: {myPlayer.skillLevel} · Games played: {myPlayer.gamesPlayed}
            </p>
            {statusHint && (
              <p className="rounded-2xl bg-white/80 px-3 py-2.5 text-sm font-medium text-sisclub-green-dark">
                {statusHint}
              </p>
            )}
            {queuePosition && myPlayer.status !== "Playing" && (
              <p className="text-sm font-medium text-sisclub-green">
                Queue position: #{queuePosition}
              </p>
            )}
            {waitlistPosition && (
              <p className="text-sm font-medium text-amber-800">
                Waitlist position: #{waitlistPosition}
              </p>
            )}
            {myPlayer.status === "Registered" && session.paymentRequired && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Payment pending — the organizer will confirm once received.
              </div>
            )}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              {canLeave && (
                <Button
                  variant="outline"
                  onClick={() => void handleLeave()}
                  disabled={leaving}
                  className="flex-1 rounded-full border-2 border-black/10"
                >
                  {leaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {myPlayer.status === "Waitlisted"
                    ? "Leave waitlist"
                    : "Leave session"}
                </Button>
              )}
              <Link
                href={`/sessions/${sessionId}/live`}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-sisclub-pink px-4 py-2 text-sm font-bold text-white hover:bg-sisclub-pink-dark"
              >
                <Radio className="mr-2 h-4 w-4" />
                Watch live
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-3xl border-2 border-dashed border-black/10">
            <CardContent className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">
                {session.status === "closed"
                  ? "This session is closed."
                  : "You have not joined this session yet."}
              </p>
              {session.status !== "closed" && (
                <Link
                  href={`/join?sessionId=${sessionId}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sisclub-green font-bold text-white hover:bg-sisclub-green-dark"
                >
                  {session.status === "full" ? "Join waitlist" : "Join now"}
                </Link>
              )}
            </CardContent>
          </Card>

          {session.status !== "closed" && (
            <Card className="rounded-3xl border-2 border-black/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-sisclub-green" />
                  Already joined?
                </CardTitle>
                <CardDescription>
                  Find your registration using the contact number you provided.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showRecovery ? (
                  <form onSubmit={handleRecover} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="recover-contact">Contact number</Label>
                      <Input
                        id="recover-contact"
                        type="tel"
                        value={recoverContact}
                        onChange={(e) => setRecoverContact(e.target.value)}
                        placeholder="09XX XXX XXXX"
                        className="h-11 rounded-2xl border-2 border-black/10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRecovery(false)}
                        className="flex-1 rounded-full"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={recovering}
                        className="flex-1 rounded-full bg-sisclub-green text-white"
                      >
                        {recovering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Find me"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowRecovery(true)}
                    className="w-full rounded-full border-2 border-black/10"
                  >
                    Find my registration
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Status updates every 15 seconds
      </p>
    </div>
  );
}

export default function PublicSessionPage({
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
      <AppHeader subtitle="Session status" backHref="/dashboard" />
      <div className="py-4 sm:py-6">
        {sessionId ? (
          <Suspense>
            <SessionStatusContent sessionId={sessionId} />
          </Suspense>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        )}
      </div>
    </PageShell>
  );
}
