"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Radio, Search } from "lucide-react";
import { toast } from "sonner";
import { ContactNumberInput } from "@/components/contact-number-input";
import { GuestAppHeader, GuestPage } from "@/components/guest/guest-page";
import {
  guestBtnOutline,
  guestBtnPink,
  guestBtnPrimary,
  guestCardClass,
  guestCardJoinedClass,
} from "@/components/guest/guest-ui";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { Button } from "@/components/ui/button";
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
import { formatWinLoss } from "@/lib/player-stats";
import { getQueuePosition, toQueuePlayer } from "@/lib/queue/queue-engine";
import { getWaitlistPosition } from "@/lib/waitlist";
import { SessionPaymentBanner } from "@/components/session-payment-banner";
import { cn } from "@/lib/utils";
import { getPhilippineMobileError } from "@/lib/phone";
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
  const [recoverContactError, setRecoverContactError] = useState<string | null>(
    null
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
    const mobileError = getPhilippineMobileError(contact);
    if (mobileError) {
      toast.error(mobileError);
      setRecoverContactError(mobileError);
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
      ? getQueuePosition(queuePlayers, myPlayer.id)
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
      <Card className={guestCardClass}>
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
          <SessionPaymentBanner session={session} />
        </CardContent>
      </Card>

      {myPlayer ? (
        <Card className={guestCardJoinedClass}>
          <CardHeader>
            <CardTitle>Your spot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{myPlayer.name}</span>
              <PlayerStatusBadge status={myPlayer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Skill: {myPlayer.skillLevel} · {formatWinLoss(myPlayer)} ·{" "}
              {myPlayer.gamesPlayed} game{myPlayer.gamesPlayed === 1 ? "" : "s"}
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
                  className={cn(guestBtnOutline, "flex-1")}
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
                className={cn(
                  guestBtnPink,
                  "inline-flex flex-1 items-center justify-center px-4 py-2 text-sm"
                )}
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
                  className={cn(
                    guestBtnPrimary,
                    "inline-flex h-12 w-full items-center justify-center"
                  )}
                >
                  {session.status === "full" ? "Join waitlist" : "Join now"}
                </Link>
              )}
            </CardContent>
          </Card>

          {session.status !== "closed" && (
            <Card className={guestCardClass}>
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
                    <ContactNumberInput
                      id="recover-contact"
                      value={recoverContact}
                      onChange={(value) => {
                        setRecoverContact(value);
                        setRecoverContactError(null);
                      }}
                      error={recoverContactError}
                      required
                      inputClassName="h-11"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRecovery(false)}
                        className={cn(guestBtnOutline, "flex-1")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={recovering}
                        className={cn(guestBtnPrimary, "flex-1")}
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
                    className={cn(guestBtnOutline, "w-full")}
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
    <GuestPage
      header={
        <GuestAppHeader
          subtitle="Your status"
          backHref="/dashboard"
          logoHref="/dashboard"
        />
      }
    >
      {sessionId ? (
        <Suspense>
          <SessionStatusContent sessionId={sessionId} />
        </Suspense>
      ) : (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
      )}
    </GuestPage>
  );
}
