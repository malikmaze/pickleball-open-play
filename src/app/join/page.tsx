"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
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
import { setJoinedPlayerId, usePlayerProfile } from "@/hooks/use-player-profile";
import { PLAYER_SKILL_LEVELS } from "@/lib/constants";
import { getPlayerProfile } from "@/lib/player-profile";
import { createClient } from "@/utils/supabase/client";
import {
  fetchSessionById,
  registerPlayerRecord,
} from "@/utils/supabase/queries";
import type { PlayerSkillLevel, Session } from "@/types";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { saveProfile } = usePlayerProfile();

  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState(() => getPlayerProfile()?.name ?? "");
  const [contactNumber, setContactNumber] = useState(
    () => getPlayerProfile()?.contactNumber ?? ""
  );
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>(
    () => getPlayerProfile()?.skillLevel ?? "Novice"
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    fetchSessionById(supabase, sessionId).then(setSession).catch(() => {});
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!contactNumber.trim()) {
      toast.error("Please enter your contact number");
      return;
    }

    if (sessionId) {
      try {
        const supabase = createClient();
        const s = session ?? (await fetchSessionById(supabase, sessionId));
        if (!s) {
          toast.error("Session not found");
          return;
        }
        if (s.status === "full") {
          toast.error("This session is full");
          return;
        }
        if (s.status === "closed") {
          toast.error("This session is closed");
          return;
        }
      } catch {
        toast.error("Failed to verify session");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const saved = saveProfile({ name, contactNumber, skillLevel });

      if (sessionId) {
        const supabase = createClient();
        const playerId = await registerPlayerRecord(supabase, sessionId, {
          name: saved.name,
          contactNumber: saved.contactNumber,
          skillLevel: saved.skillLevel,
          note,
        });
        setJoinedPlayerId(sessionId, playerId);
        toast.success("Registered! See you on court.");
        router.push(`/session/${sessionId}`);
      } else {
        toast.success("Profile saved successfully");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <AppHeader
        subtitle={sessionId ? "Register for session" : "Your player profile"}
        backHref="/dashboard"
      />

      <div className="py-6">
        <Card className="rounded-3xl border-2 border-black/10 shadow-md">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-sisclub-green-dark">
              {sessionId ? "Register for Open Play" : "Player Profile"}
            </CardTitle>
            <CardDescription>
              {sessionId
                ? "Reserve your spot. No account needed."
                : "Save your details for faster sign-ups."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session?.paymentRequired && (
              <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Payment required for this session</p>
                {session.paymentAmount && <p>Amount: ₱{session.paymentAmount}</p>}
                {session.paymentNote && <p>{session.paymentNote}</p>}
                {session.paymentInstructions && (
                  <p className="mt-1">{session.paymentInstructions}</p>
                )}
                <p className="mt-2 text-xs">
                  You can register now. An organizer will mark you as Secured after payment.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact number *</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill">Skill level *</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(v) => setSkillLevel(v as PlayerSkillLevel)}
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

              {sessionId && (
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    placeholder="e.g. arriving late, first time"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-12 rounded-2xl border-2 border-black/10"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border-2 border-black/10 bg-sisclub-green font-bold text-white shadow-sm transition-all hover:bg-sisclub-green-dark hover:shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : sessionId ? (
                  "Register"
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
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
