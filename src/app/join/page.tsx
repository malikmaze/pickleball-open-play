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
import { useAppData } from "@/hooks/use-app-data";
import { SKILL_LEVELS } from "@/lib/constants";
import { joinSession, savePlayerProfile } from "@/lib/storage";
import type { SkillLevel } from "@/types";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { data, updateData } = useAppData();

  const [name, setName] = useState(data?.playerProfile?.name ?? "");
  const [contactNumber, setContactNumber] = useState(
    data?.playerProfile?.contactNumber ?? ""
  );
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(
    data?.playerProfile?.skillLevel ?? "Mixed"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (sessionId && data) {
      const session = data.sessions.find((s) => s.id === sessionId);
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
    }

    setIsSubmitting(true);

    updateData((prev) => {
      let next = savePlayerProfile(prev, {
        id: prev.playerProfile?.id,
        name,
        contactNumber,
        skillLevel,
      });

      if (sessionId && next.playerProfile) {
        next = joinSession(next, sessionId, next.playerProfile);
      }

      return next;
    });

    toast.success(
      sessionId ? "You're in! See you on court." : "Profile saved successfully"
    );
    setIsSubmitting(false);
    router.push("/dashboard");
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
