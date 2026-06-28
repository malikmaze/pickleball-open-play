"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PageShell } from "@/components/page-shell";
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
} from "@/hooks/use-player-profile";
import { getQueuePosition, toQueuePlayer } from "@/lib/queue/queue-engine";
import { getWaitlistPosition } from "@/lib/waitlist";
import { createClient } from "@/utils/supabase/client";
import { fetchSessionById } from "@/utils/supabase/queries";
import type { Session } from "@/types";

function SessionStatusContent({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionById(supabase, sessionId);
      setSession(data);
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
        const data = await fetchSessionById(supabase, sessionId);
        if (!cancelled) setSession(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

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
        <Card className="rounded-3xl border-2 border-sisclub-green/30">
          <CardHeader>
            <CardTitle>Your spot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{myPlayer.name}</span>
              <PlayerStatusBadge status={myPlayer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Skill: {myPlayer.skillLevel} · Games played: {myPlayer.gamesPlayed}
            </p>
            {queuePosition && (
              <p className="text-sm font-medium text-sisclub-green">
                Queue position: #{queuePosition}
              </p>
            )}
            {waitlistPosition && (
              <p className="text-sm font-medium text-amber-800">
                Waitlist position: #{waitlistPosition}
              </p>
            )}
            {myPlayer.status === "Waitlisted" && (
              <p className="text-sm text-muted-foreground">
                You will be added automatically when a spot opens.
              </p>
            )}
            {myPlayer.status === "Registered" && session.paymentRequired && (
              <p className="text-sm text-amber-700">
                Awaiting payment confirmation from organizer.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-2 border-dashed border-black/10">
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              You have not joined this session yet.
            </p>
            <Link
              href={`/join?sessionId=${sessionId}`}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sisclub-green font-bold text-white hover:bg-sisclub-green-dark"
            >
              {session.status === "full" ? "Join waitlist" : "Join now"}
            </Link>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={() => load()} className="w-full rounded-full">
        Refresh status
      </Button>

      <Link
        href={`/sessions/${sessionId}/live`}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sisclub-pink font-bold text-white hover:bg-sisclub-pink-dark"
      >
        Watch live
      </Link>
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
      <div className="py-6">
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
