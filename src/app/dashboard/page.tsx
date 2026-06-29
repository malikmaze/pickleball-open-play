"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GuestAppHeader, GuestPage } from "@/components/guest/guest-page";
import { GuestPageHeader } from "@/components/guest/guest-ui";
import { SessionCard } from "@/components/session-card";
import { useAuth } from "@/hooks/use-auth";
import {
  getJoinedPlayerId,
  getJoinedPlayerIds,
  removeJoinedPlayerId,
} from "@/hooks/use-player-profile";
import { useSessions } from "@/hooks/use-sessions";
import { canPlayerWithdrawRegistration } from "@/lib/player-permissions";
import {
  formatSessionDateHeading,
  getTodayDate,
} from "@/lib/sessions";
import { createClient } from "@/utils/supabase/client";
import { leaveSessionRecord } from "@/utils/supabase/queries";
import type { PlayerStatus } from "@/types";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <GuestPage header={<GuestAppHeader subtitle="Schedule" logoHref="/" />}>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        </GuestPage>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessions, isLoading, error, refetch } = useSessions("upcoming");
  const { isAdmin, loading: authLoading } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [joinedRevision, setJoinedRevision] = useState(0);

  const joinedIds = useMemo(() => {
    void joinedRevision;
    const stored = getJoinedPlayerIds();
    const map: Record<string, string> = {};
    for (const [sessionId, playerId] of Object.entries(stored)) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session?.players.some((p) => p.id === playerId)) {
        map[sessionId] = playerId;
      }
    }
    return map;
  }, [sessions, joinedRevision]);

  const bumpJoined = useCallback(() => {
    setJoinedRevision((n) => n + 1);
  }, []);

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      toast.error("Admin access only");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const handleJoin = useCallback(
    (sessionId: string) => {
      if (isAdmin) return;
      router.push(`/join?sessionId=${sessionId}`);
    },
    [isAdmin, router]
  );

  const handleLeave = useCallback(
    async (sessionId: string) => {
      const playerId = joinedIds[sessionId] ?? getJoinedPlayerId(sessionId);
      if (!playerId) return;

      const session = sessions.find((s) => s.id === sessionId);
      const player = session?.players.find((p) => p.id === playerId);
      if (
        player &&
        !canPlayerWithdrawRegistration(player.status as PlayerStatus)
      ) {
        toast.error(
          "You can't cancel after check-in. Ask the admin to remove you from the queue."
        );
        return;
      }

      setActionLoading(true);
      try {
        const supabase = createClient();
        await leaveSessionRecord(supabase, playerId, sessionId);
        removeJoinedPlayerId(sessionId);
        bumpJoined();
        await refetch();
        toast.success("You've left the session");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to leave session"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [joinedIds, refetch, sessions, bumpJoined]
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const list = map.get(session.date) ?? [];
      list.push(session);
      map.set(session.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  const mySessions = useMemo(() => {
    return sessions.filter((session) => joinedIds[session.id]);
  }, [sessions, joinedIds]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <GuestPage header={<GuestAppHeader subtitle="Schedule" logoHref="/" />}>
      <GuestPageHeader
        title="Open Play Schedule"
        description={`Today and upcoming sessions · Today is ${todayLabel}`}
      />

        {isLoading || authLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm font-semibold text-sisclub-green underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="No upcoming sessions"
            description="Check back soon — organizers add open play sessions here. You can also watch live courts when a session is running."
          />
        ) : (
          <div className="space-y-8">
            {!isAdmin && mySessions.length > 0 && (
              <section className="space-y-4">
                <h3 className="font-heading text-lg font-bold text-sisclub-green-dark">
                  My sessions
                </h3>
                {mySessions.map((session, i) => {
                  const joinedId = joinedIds[session.id];
                  const myPlayer = joinedId
                    ? session.players.find((p) => p.id === joinedId)
                    : undefined;

                  return (
                    <div
                      key={`my-${session.id}`}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                    >
                      <SessionCard
                        session={session}
                        currentPlayerId={joinedId}
                        myPlayerStatus={myPlayer?.status}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        isLoading={actionLoading}
                        canRegister={false}
                      />
                    </div>
                  );
                })}
              </section>
            )}

            {sessionsByDate.map(([date, dateSessions]) => (
              <section key={date} className="space-y-4">
                <h3 className="font-heading text-lg font-bold text-sisclub-green-dark">
                  {formatSessionDateHeading(date)}
                  {date === getTodayDate() && (
                    <span className="ml-2 text-sm font-semibold text-sisclub-pink-dark">
                      Today
                    </span>
                  )}
                </h3>
                {dateSessions
                  .filter(
                    (session) =>
                      isAdmin || !joinedIds[session.id]
                  )
                  .map((session, i) => {
                  const joinedId = joinedIds[session.id];
                  const myPlayer = joinedId
                    ? session.players.find((p) => p.id === joinedId)
                    : undefined;
                  const isJoined =
                    !!joinedId &&
                    session.players.some((p) => p.id === joinedId);

                  return (
                    <div
                      key={session.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                    >
                      <SessionCard
                        session={session}
                        currentPlayerId={isJoined ? joinedId : undefined}
                        myPlayerStatus={myPlayer?.status}
                        onJoin={!isAdmin ? handleJoin : undefined}
                        onLeave={!isAdmin ? handleLeave : undefined}
                        isLoading={actionLoading}
                        canRegister={
                          !isAdmin &&
                          session.status !== "closed" &&
                          !isJoined
                        }
                      />
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        )}
    </GuestPage>
  );
}
