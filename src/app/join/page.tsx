"use client";

import { Suspense, useState } from "react";
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
import { SKILL_LEVELS } from "@/lib/constants";
import { getPlayerProfile } from "@/lib/player-profile";
import { createClient } from "@/utils/supabase/client";
import {
  fetchSessionById,
  joinSessionRecord,
} from "@/utils/supabase/queries";
import type { SkillLevel } from "@/types";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { saveProfile } = usePlayerProfile();

  const [name, setName] = useState(() => getPlayerProfile()?.name ?? "");
  const [contactNumber, setContactNumber] = useState(
    () => getPlayerProfile()?.contactNumber ?? ""
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(
    () => getPlayerProfile()?.skillLevel ?? "Mixed"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (sessionId) {
      try {
        const supabase = createClient();
        const session = await fetchSessionById(supabase, sessionId);
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
        const playerId = await joinSessionRecord(supabase, sessionId, saved);
        setJoinedPlayerId(sessionId, playerId);
        toast.success("You're in! See you on court.");
      } else {
        toast.success("Profile saved successfully");
      }

      router.push("/dashboard");
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
        subtitle={sessionId ? "Join a session" : "Your player profile"}
        backHref="/dashboard"
      />

      <div className="py-6">
        <Card className="rounded-3xl border-2 border-black/10 shadow-md">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-sisclub-green-dark">
              {sessionId ? "Join Open Play" : "Player Profile"}
            </CardTitle>
            <CardDescription>
              {sessionId
                ? "Tell us a bit about yourself to join this session."
                : "Save your details for faster sign-ups."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Player name *</Label>
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
                <Label htmlFor="contact">Contact number (optional)</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill">Skill level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(v) => setSkillLevel(v as SkillLevel)}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border-2 border-black/10">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  "Join Session"
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
