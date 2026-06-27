"use client";

import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Session } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkillBadge, StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  currentPlayerId?: string;
  onJoin?: (sessionId: string) => void;
  onLeave?: (sessionId: string) => void;
  isLoading?: boolean;
}

function formatTimeRange(start: string, end: string) {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function SessionCard({
  session,
  currentPlayerId,
  onJoin,
  onLeave,
  isLoading,
}: SessionCardProps) {
  const router = useRouter();
  const isJoined = currentPlayerId
    ? session.players.some((p) => p.id === currentPlayerId)
    : false;
  const canJoin = session.status === "open" && !isJoined;
  const canLeave = isJoined && session.status !== "closed";

  const handleJoin = () => {
    if (!onJoin) {
      router.push(`/join?sessionId=${session.id}`);
      return;
    }
    onJoin(session.id);
  };

  const handleLeave = () => {
    if (!onLeave || !currentPlayerId) return;
    onLeave(session.id);
    toast.success("You've left the session");
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-3xl border-2 border-black/10 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        isJoined && "ring-2 ring-sisclub-green/30"
      )}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-heading text-lg font-bold text-sisclub-green-dark">
            {session.title}
          </CardTitle>
          <StatusBadge status={session.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <SkillBadge level={session.skillLevel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-foreground/80">
          <Clock className="h-4 w-4 shrink-0 text-sisclub-green" />
          <span>{formatTimeRange(session.startTime, session.endTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <MapPin className="h-4 w-4 shrink-0 text-sisclub-green" />
          <span>
            {session.location} · {session.courtNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <Users className="h-4 w-4 shrink-0 text-sisclub-green" />
          <span>
            <span className="font-semibold text-sisclub-green-dark">
              {session.players.length}
            </span>
            {" / "}
            {session.maxPlayers} players
          </span>
        </div>

        {session.players.length > 0 && (
          <div className="mt-3 rounded-2xl bg-sisclub-pink-soft/50 px-3 py-2">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Joined
            </p>
            <p className="text-sm text-foreground/90">
              {session.players.map((p) => p.name).join(", ")}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2 sm:flex-row">
        {canJoin && (
          <Button
            onClick={handleJoin}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-black/10 bg-sisclub-green font-semibold text-white shadow-sm transition-all hover:bg-sisclub-green-dark hover:shadow-md"
          >
            Register
          </Button>
        )}
        {canLeave && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-black/10 font-semibold transition-all hover:bg-sisclub-pink-soft"
          >
            Leave
          </Button>
        )}
        {session.status === "full" && !isJoined && (
          <Button
            disabled
            className="flex-1 rounded-full border-2 border-black/10"
          >
            Session Full
          </Button>
        )}
        {session.status === "closed" && (
          <Button
            disabled
            variant="outline"
            className="flex-1 rounded-full border-2 border-black/10"
          >
            Closed
          </Button>
        )}
        {isJoined && (
          <Link
            href={`/session/${session.id}`}
            className="text-center text-xs font-medium text-sisclub-green underline-offset-2 hover:underline"
          >
            View my status →
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
