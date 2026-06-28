"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
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
        <PageShell>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        </PageShell>
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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <AppHeader subtitle="Today & upcoming" />

      <div className="py-6">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
            Open Play Schedule
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Today and upcoming sessions · Today is {todayLabel}
          </p>
        </div>

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
          <EmptyState />
        ) : (
          <div className="space-y-8">
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
                {dateSessions.map((session, i) => {
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
      </div>
    </PageShell>
  );
}
