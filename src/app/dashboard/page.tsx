"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { SessionCard } from "@/components/session-card";
import { useAppData } from "@/hooks/use-app-data";
import { useMounted } from "@/hooks/use-mounted";
import { getTodaySessions, joinSession, leaveSession } from "@/lib/storage";

export default function DashboardPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { data, isLoading, updateData } = useAppData();
  const [actionLoading, setActionLoading] = useState(false);

  const todaySessions = data ? getTodaySessions(data.sessions) : [];
  const playerId = data?.playerProfile?.id;

  const handleJoin = useCallback(
    (sessionId: string) => {
      if (!data?.playerProfile) {
        router.push(`/join?sessionId=${sessionId}`);
        return;
      }

      setActionLoading(true);
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) {
        toast.error("Session not found");
        setActionLoading(false);
        return;
      }

      if (session.status === "full") {
        toast.error("This session is full");
        setActionLoading(false);
        return;
      }

      if (session.status === "closed") {
        toast.error("This session is closed");
        setActionLoading(false);
        return;
      }

      updateData((prev) => joinSession(prev, sessionId, prev.playerProfile!));
      toast.success("You're in! See you on court.");
      setActionLoading(false);
    },
    [data, router, updateData]
  );

  const handleLeave = useCallback(
    (sessionId: string) => {
      if (!playerId) return;
      setActionLoading(true);
      updateData((prev) => leaveSession(prev, sessionId, playerId));
      setActionLoading(false);
    },
    [playerId, updateData]
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

        {!mounted || isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        ) : todaySessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {todaySessions.map((session, i) => (
              <div
                key={session.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <SessionCard
                  session={session}
                  currentPlayerId={playerId}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  isLoading={actionLoading}
                />
              </div>
            ))}
          </div>
        )}

        {data?.playerProfile ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Playing as{" "}
            <Link
              href="/join"
              className="font-semibold text-sisclub-green-dark underline-offset-2 hover:underline"
            >
              {data.playerProfile.name}
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
