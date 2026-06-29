"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { Loader2, Radio } from "lucide-react";
import { GuestAppHeader, GuestPage } from "@/components/guest/guest-page";
import { GuestPageHeader, guestBtnPrimary, guestCardClass } from "@/components/guest/guest-ui";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJoinedPlayerIds } from "@/hooks/use-player-profile";
import { FreeSessionBadge } from "@/components/free-session-badge";
import { formatSessionDate } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { useSessions } from "@/hooks/use-sessions";

function LivePicker() {
  const { sessions, isLoading, error, refetch } = useSessions("upcoming");
  const joinedIds = useMemo(() => getJoinedPlayerIds(), []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm font-semibold text-sisclub-green underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Nothing live right now"
        description="When a session is running, you'll see courts and the queue here. Check the schedule for upcoming open play."
      />
    );
  }

  const sorted = [...sessions].sort((a, b) => {
    const aJoined = joinedIds[a.id] ? 0 : 1;
    const bJoined = joinedIds[b.id] ? 0 : 1;
    if (aJoined !== bJoined) return aJoined - bJoined;
    return a.date.localeCompare(b.date);
  });

  return (
    <div className="space-y-4">
      {sorted.map((session) => {
        const isJoined = !!joinedIds[session.id];
        const playingCount = session.players.filter(
          (p) => p.status === "Playing"
        ).length;

        return (
          <div key={session.id} className="relative">
            {!session.paymentRequired && (
              <FreeSessionBadge variant="sticker" />
            )}
            <Card
              className={
                isJoined
                  ? "rounded-3xl border-2 border-sisclub-green/30 bg-gradient-to-br from-white via-pink-50/30 to-emerald-50/40 shadow-md shadow-sisclub-green/10 ring-1 ring-sisclub-green/15"
                  : guestCardClass
              }
            >
              <CardHeader
                className={cn(
                  "pb-2",
                  !session.paymentRequired && "pr-[4.75rem] pt-1"
                )}
              >
                <CardTitle className="font-heading text-lg text-sisclub-green-dark">
                  {session.title}
                  {isJoined && (
                    <span className="ml-2 text-xs font-semibold text-sisclub-green">
                      · You&apos;re in
                    </span>
                  )}
                </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatSessionDate(session.date)} · {session.location} ·{" "}
                {session.courtCount} courts
                {playingCount > 0 && (
                  <span className="text-sisclub-pink-dark">
                    {" "}
                    · {playingCount} playing now
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <Link href={`/sessions/${session.id}/live`}>
                <Button className={cn(guestBtnPrimary, "w-full sm:w-auto")}>
                  <Radio className="mr-2 h-4 w-4" />
                  Watch live
                </Button>
              </Link>
            </CardContent>
          </Card>
          </div>
        );
      })}
    </div>
  );
}

export default function LivePage() {
  return (
    <GuestPage
      header={
        <GuestAppHeader
          subtitle="Courts"
          backHref="/dashboard"
          logoHref="/dashboard"
        />
      }
    >
      <GuestPageHeader
        title="Live courts"
        description="Pick a session to watch games and the queue."
      />
      <Suspense
        fallback={
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        }
      >
        <LivePicker />
      </Suspense>
    </GuestPage>
  );
}
