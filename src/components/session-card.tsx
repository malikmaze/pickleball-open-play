"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Radio, Users } from "lucide-react";
import type { PlayerStatus, Session } from "@/types";
import { canPlayerWithdrawRegistration } from "@/lib/player-permissions";
import {
  countAdmittedPlayers,
  getWaitlistedPlayers,
} from "@/lib/waitlist";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FreeSessionBadge } from "@/components/free-session-badge";
import {
  guestBtnOutline,
  guestBtnPink,
  guestBtnPrimary,
  guestCardClass,
  guestCardJoinedClass,
} from "@/components/guest/guest-ui";
import { SkillBadge, StatusBadge } from "@/components/status-badge";
import { formatSessionCourtsLabel } from "@/lib/court-schedule";
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
  const myPlayer = isJoined
    ? session.players.find((p) => p.id === currentPlayerId)
    : undefined;
  const admittedCount = countAdmittedPlayers(session.players);
  const waitlistCount = getWaitlistedPlayers(session.players).length;
  const isWaitlisted = myPlayerStatus === "Waitlisted";
  const isPast = isSessionPast(session.date);
  const paymentPending =
    isJoined &&
    session.paymentRequired &&
    myPlayer?.status === "Registered";
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

  const isFree = !session.paymentRequired;

  return (
    <div className="relative">
      {isFree && <FreeSessionBadge variant="sticker" />}
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
          isJoined ? guestCardJoinedClass : guestCardClass
        )}
      >
        <CardHeader
          className={cn("space-y-3 pb-3", isFree && "pr-[4.75rem] pt-1")}
        >
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-heading text-base font-bold text-sisclub-green-dark sm:text-lg">
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
            {session.location} · {formatSessionCourtsLabel(session.courtCount)}
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

        {paymentPending && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-semibold">Payment pending</p>
            {session.paymentInstructions && (
              <p className="mt-0.5 text-xs">{session.paymentInstructions}</p>
            )}
          </div>
        )}

        {isWaitlisted && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
            You&apos;re on the waitlist — we&apos;ll add you automatically if a
            spot opens.
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2">
        {isJoined ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Link
              href={`/session/${session.id}`}
              className={cn(
                guestBtnPrimary,
                "inline-flex flex-1 items-center justify-center px-4 py-2.5 text-sm"
              )}
            >
              My status
            </Link>
            <Link
              href={`/sessions/${session.id}/live`}
              className={cn(
                guestBtnPink,
                "inline-flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-sm"
              )}
            >
              <Radio className="h-4 w-4" />
              Watch live
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {canJoin && (
              <Button
                onClick={handleJoin}
                disabled={isLoading}
                className={cn(guestBtnPrimary, "flex-1 shadow-sm")}
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
            {!canJoin && !canJoinWaitlist && !isPast && session.status !== "closed" && (
              <Link
                href={`/sessions/${session.id}/live`}
                className={cn(guestBtnOutline, "inline-flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-sm")}
              >
                <Radio className="h-4 w-4" />
                Watch live
              </Link>
            )}
          </div>
        )}

        {canLeave && (
          <Button
            variant="ghost"
            onClick={handleLeave}
            disabled={isLoading}
            className="w-full text-xs text-muted-foreground hover:text-destructive"
          >
            {isWaitlisted ? "Leave waitlist" : "Leave session"}
          </Button>
        )}
        {isJoined && !canLeave && myPlayerStatus && !isWaitlisted && (
          <p className="w-full text-center text-xs text-muted-foreground">
            Checked in — ask the organizer to remove you if needed
          </p>
        )}
        {isPast && !isJoined && (
          <Button
            disabled
            variant="outline"
            className="w-full rounded-full border-2 border-black/10"
          >
            Past session
          </Button>
        )}
        {session.status === "closed" && !isJoined && !isPast && (
          <Button
            disabled
            variant="outline"
            className="w-full rounded-full border-2 border-black/10"
          >
            Closed
          </Button>
        )}
      </CardFooter>
      </Card>
    </div>
  );
}
