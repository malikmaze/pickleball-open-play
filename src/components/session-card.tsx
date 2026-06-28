"use client";

import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PlayerStatus, Session } from "@/types";
import { canPlayerWithdrawRegistration } from "@/lib/player-permissions";
import {
  countAdmittedPlayers,
  getWaitlistedPlayers,
  isAdmittedPlayer,
} from "@/lib/waitlist";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkillBadge, StatusBadge } from "@/components/status-badge";
import { formatSessionDate, isSessionPast } from "@/lib/sessions";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  currentPlayerId?: string;
  myPlayerStatus?: PlayerStatus;
  onJoin?: (sessionId: string) => void;
  onLeave?: (sessionId: string) => void;
  isLoading?: boolean;
  canRegister?: boolean;
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
  myPlayerStatus,
  onJoin,
  onLeave,
  isLoading,
  canRegister = true,
}: SessionCardProps) {
  const router = useRouter();
  const isJoined = currentPlayerId
    ? session.players.some((p) => p.id === currentPlayerId)
    : false;
  const admittedPlayers = session.players.filter((p) =>
    isAdmittedPlayer(p.status)
  );
  const admittedCount = countAdmittedPlayers(session.players);
  const waitlistCount = getWaitlistedPlayers(session.players).length;
  const isWaitlisted = myPlayerStatus === "Waitlisted";
  const isPast = isSessionPast(session.date);
  const canJoin =
    canRegister && !isPast && session.status === "open" && !isJoined;
  const canJoinWaitlist =
    canRegister && !isPast && session.status === "full" && !isJoined;
  const canWithdraw =
    myPlayerStatus !== undefined &&
    canPlayerWithdrawRegistration(myPlayerStatus);
  const canLeave =
    isJoined && session.status !== "closed" && canWithdraw;

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
          <span>
            <span className="font-medium text-sisclub-green-dark">
              {formatSessionDate(session.date)} ·{" "}
            </span>
            {formatTimeRange(session.startTime, session.endTime)}
          </span>
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
              {admittedCount}
            </span>
            {" / "}
            {session.maxPlayers} players
            {waitlistCount > 0 && (
              <span className="text-muted-foreground">
                {" "}
                · {waitlistCount} on waitlist
              </span>
            )}
          </span>
        </div>

        {admittedPlayers.length > 0 && (
          <div className="mt-3 rounded-2xl bg-sisclub-pink-soft/50 px-3 py-2">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Joined
            </p>
            <p className="text-sm text-foreground/90">
              {admittedPlayers.map((p) => p.name).join(", ")}
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
            Join
          </Button>
        )}
        {canJoinWaitlist && (
          <Button
            onClick={handleJoin}
            disabled={isLoading}
            variant="outline"
            className="flex-1 rounded-full border-2 border-amber-300/80 bg-amber-50 font-semibold text-amber-900 shadow-sm transition-all hover:bg-amber-100"
          >
            Join waitlist
          </Button>
        )}
        {canLeave && (
          <Button
            variant="outline"
            onClick={handleLeave}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-black/10 font-semibold transition-all hover:bg-sisclub-pink-soft"
          >
            {isWaitlisted ? "Leave waitlist" : "Leave session"}
          </Button>
        )}
        {isJoined && !canLeave && myPlayerStatus && !isWaitlisted && (
          <p className="w-full text-center text-xs text-muted-foreground">
            Checked in — ask the admin to remove you from the queue if needed
          </p>
        )}
        {isWaitlisted && (
          <p className="w-full text-center text-xs font-medium text-amber-800">
            On waitlist — you will be added automatically if a spot opens
          </p>
        )}
        {isPast && !isJoined && (
          <Button
            disabled
            variant="outline"
            className="flex-1 rounded-full border-2 border-black/10"
          >
            Past session
          </Button>
        )}
        {session.status === "closed" && !isJoined && !isPast && (
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
        <Link
          href={`/sessions/${session.id}/live`}
          className="text-center text-xs font-medium text-sisclub-pink-dark underline-offset-2 hover:underline"
        >
          Watch live →
        </Link>
      </CardFooter>
    </Card>
  );
}
