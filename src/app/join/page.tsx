"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin } from "lucide-react";
import { GuestAppHeader, GuestPage } from "@/components/guest/guest-page";
import {
  guestBtnOutline,
  guestBtnPrimary,
  guestCardClass,
  guestCardJoinedClass,
} from "@/components/guest/guest-ui";
import { ContactNumberInput } from "@/components/contact-number-input";
import { SessionPaymentBanner } from "@/components/session-payment-banner";
import { FreeSessionBadge } from "@/components/free-session-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getJoinedPlayerId,
  setJoinedPlayerId,
  usePlayerProfile,
} from "@/hooks/use-player-profile";
import { getPlayerProfile } from "@/lib/player-profile";
import { PLAYER_SKILL_LEVELS, PROFILE_GENDERS, normalizeProfileGender } from "@/lib/constants";
import { formatSessionDate } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { getPhilippineMobileError, parsePhilippineMobile } from "@/lib/phone";
import { createClient } from "@/utils/supabase/client";
import {
  fetchSessionById,
  registerPlayerRecord,
} from "@/utils/supabase/queries";
import type { PlayerSkillLevel, ProfileGender, Session } from "@/types";

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

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { saveProfile } = usePlayerProfile();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [name, setName] = useState(() => getPlayerProfile()?.name ?? "");
  const [contactNumber, setContactNumber] = useState(
    () => getPlayerProfile()?.contactNumber ?? ""
  );
  const [gender, setGender] = useState<ProfileGender>(() =>
    normalizeProfileGender(getPlayerProfile()?.gender)
  );
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>(
    () => getPlayerProfile()?.skillLevel ?? "Novice"
  );
  const [note, setNote] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    fetchSessionById(supabase, sessionId)
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId) return;

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!contactNumber.trim()) {
      toast.error("Please enter your contact number");
      setContactError("Please enter your contact number");
      return;
    }
    const mobileError = getPhilippineMobileError(contactNumber);
    if (mobileError) {
      toast.error(mobileError);
      setContactError(mobileError);
      return;
    }
    const normalizedContact = parsePhilippineMobile(contactNumber)!;

    try {
      const supabase = createClient();
      const s = session ?? (await fetchSessionById(supabase, sessionId));
      if (!s) {
        toast.error("Session not found");
        return;
      }
      if (s.status === "closed") {
        toast.error("This session is closed");
        return;
      }

      const existingId = getJoinedPlayerId(sessionId);
      if (existingId) {
        const existing = s.players.find((p) => p.id === existingId);
        if (existing) {
          toast.info(
            existing.status === "Waitlisted"
              ? "You're already on the waitlist"
              : "You've already joined this session"
          );
          router.push(`/session/${sessionId}`);
          return;
        }
      }
    } catch {
      toast.error("Failed to verify session");
      return;
    }

    setIsSubmitting(true);

    try {
      saveProfile({ name, contactNumber: normalizedContact, gender, skillLevel });
      const supabase = createClient();
      const { playerId, waitlisted } = await registerPlayerRecord(
        supabase,
        sessionId,
        {
          name: name.trim(),
          contactNumber: normalizedContact,
          gender,
          skillLevel,
          note,
        }
      );
      setJoinedPlayerId(sessionId, playerId);
      toast.success(
        waitlisted
          ? "You're on the waitlist! We'll add you if a spot opens."
          : "You're in! See you on court."
      );
      router.push(`/session/${sessionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionId) {
    return null;
  }

  const isClosed = session?.status === "closed";

  return (
    <GuestPage
      header={
        <GuestAppHeader
          subtitle="Join open play"
          backHref="/dashboard"
          logoHref="/dashboard"
        />
      }
      className="space-y-4"
    >
        {sessionLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        ) : session ? (
          <div className="relative">
            {!session.paymentRequired && (
              <FreeSessionBadge variant="sticker" />
            )}
            <Card className={guestCardJoinedClass}>
              <CardHeader
                className={cn(
                  "pb-2",
                  !session.paymentRequired && "pr-[4.75rem] pt-1"
                )}
              >
                <CardTitle className="font-heading text-lg text-sisclub-green-dark">
                  {session.title}
                </CardTitle>
              <CardDescription className="space-y-1">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatSessionDate(session.date)} ·{" "}
                  {formatTimeRange(session.startTime, session.endTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {session.location}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-8 text-center text-sm text-destructive">
            Session not found.{" "}
            <Link href="/dashboard" className="font-semibold underline">
              Back to schedule
            </Link>
          </div>
        )}

        {isClosed ? (
          <Card className={guestCardClass}>
            <CardContent className="py-10 text-center">
              <p className="font-medium text-sisclub-green-dark">
                Registration is closed
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This session is no longer accepting players.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className={cn(guestBtnOutline, "mt-6")}>
                  View other sessions
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className={guestCardClass}>
            <CardHeader>
              <CardTitle className="font-heading text-xl text-sisclub-green-dark">
                Your details
              </CardTitle>
              <CardDescription>
                {session?.status === "full"
                  ? "Session is full — join the waitlist and we'll add you if a spot opens."
                  : "Enter your details to join. No account needed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session && (
                <div className="mb-5">
                  <SessionPaymentBanner session={session} joinForm />
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-black/10"
                    required
                    disabled={!session}
                  />
                </div>

                <ContactNumberInput
                  value={contactNumber}
                  onChange={(value) => {
                    setContactNumber(value);
                    setContactError(null);
                  }}
                  error={contactError}
                  hint="Used to find your registration if you return on another device. Philippine mobile only (09XX XXX XXXX)."
                  required
                  disabled={!session}
                />

                <div className="space-y-2">
                  <Label>Gender identity *</Label>
                  <Select
                    value={gender}
                    onValueChange={(v) => setGender(v as ProfileGender)}
                    disabled={!session}
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-2 border-black/10">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFILE_GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill">Skill level *</Label>
                  <Select
                    value={skillLevel}
                    onValueChange={(v) => setSkillLevel(v as PlayerSkillLevel)}
                    disabled={!session}
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-2 border-black/10">
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYER_SKILL_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    placeholder="e.g. arriving late, first time"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-black/10"
                    disabled={!session}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !session}
                  className={cn(guestBtnPrimary, "h-12 w-full")}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining…
                    </>
                  ) : session?.status === "full" ? (
                    "Join waitlist"
                  ) : (
                    "Join Open Play"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
    </GuestPage>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
