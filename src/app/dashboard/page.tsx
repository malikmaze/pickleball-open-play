"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { SessionCard } from "@/components/session-card";
import {
  getJoinedPlayerId,
  removeJoinedPlayerId,
  setJoinedPlayerId,
  usePlayerProfile,
} from "@/hooks/use-player-profile";
import { useSessions } from "@/hooks/use-sessions";
import { createClient } from "@/utils/supabase/client";
import {
  joinSessionRecord,
  leaveSessionRecord,
} from "@/utils/supabase/queries";

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
  const { sessions, isLoading, error, refetch } = useSessions();
  const { profile } = usePlayerProfile();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      toast.error("You don't have admin access");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const handleJoin = useCallback(
    async (sessionId: string) => {
      if (!profile) {
        router.push(`/join?sessionId=${sessionId}`);
        return;
      }

      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        toast.error("Session not found");
        return;
      }
      if (session.status === "full") {
        toast.error("This session is full");
        return;
      }
      if (session.status === "closed") {
        toast.error("This session is closed");
        return;
      }

      const existingId = getJoinedPlayerId(sessionId);
      if (existingId && session.players.some((p) => p.id === existingId)) {
        toast.info("You're already in this session");
        return;
      }

      setActionLoading(true);
      try {
        const supabase = createClient();
        const playerId = await joinSessionRecord(supabase, sessionId, profile);
        setJoinedPlayerId(sessionId, playerId);
        await refetch();
        toast.success("You're in! See you on court.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to join session"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [profile, router, sessions, refetch]
  );

  const handleLeave = useCallback(
    async (sessionId: string) => {
      const playerId = getJoinedPlayerId(sessionId);
      if (!playerId) return;

      setActionLoading(true);
      try {
        const supabase = createClient();
        await leaveSessionRecord(supabase, playerId, sessionId);
        removeJoinedPlayerId(sessionId);
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
    [refetch]
  );

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <AppHeader subtitle="Today's schedule" />

      <div className="py-6">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
            Open Play Today
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
        </div>

        {isLoading ? (
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
          <div className="space-y-4">
            {sessions.map((session, i) => {
              const joinedId = getJoinedPlayerId(session.id);
              const isJoined =
                !!joinedId && session.players.some((p) => p.id === joinedId);

              return (
                <div
                  key={session.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <SessionCard
                    session={session}
                    currentPlayerId={isJoined ? joinedId : undefined}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    isLoading={actionLoading}
                  />
                </div>
              );
            })}
          </div>
        )}

        {profile ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Playing as{" "}
            <Link
              href="/join"
              className="font-semibold text-sisclub-green-dark underline-offset-2 hover:underline"
            >
              {profile.name}
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/join"
              className="font-semibold text-sisclub-green underline-offset-2 hover:underline"
            >
              Set up your player profile →
            </Link>
          </p>
        )}
      </div>
    </PageShell>
  );
}
