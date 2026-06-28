"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { PLAYER_SKILL_LEVELS, PROFILE_GENDERS, normalizeProfileGender } from "@/lib/constants";
import type { PlayerSkillLevel, ProfileGender } from "@/types";

export default function ProfilePage() {
  const { profile, saveProfile } = usePlayerProfile();

  return (
    <ProfileForm
      key={profile?.id ?? "new"}
      initial={{
        name: profile?.name ?? "",
        contactNumber: profile?.contactNumber ?? "",
        gender: normalizeProfileGender(profile?.gender),
        skillLevel: profile?.skillLevel ?? "Novice",
      }}
      onSave={saveProfile}
    />
  );
}

function ProfileForm({
  initial,
  onSave,
}: {
  initial: {
    name: string;
    contactNumber: string;
    gender: ProfileGender;
    skillLevel: PlayerSkillLevel;
  };
  onSave: ReturnType<typeof usePlayerProfile>["saveProfile"];
}) {
  const [name, setName] = useState(initial.name);
  const [contactNumber, setContactNumber] = useState(initial.contactNumber);
  const [gender, setGender] = useState<ProfileGender>(initial.gender);
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>(initial.skillLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    onSave({ name, contactNumber, gender, skillLevel });
    toast.success("Profile saved for this browser session");
  };

  return (
    <PageShell>
      <AppHeader subtitle="Your profile" backHref="/dashboard" />
      <div className="py-4 sm:py-6">
        <Card className="rounded-3xl border-2 border-black/10 shadow-md">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-sisclub-green-dark">
              Player profile
            </CardTitle>
            <CardDescription>
              Saved on this device only — used to pre-fill the join form. No
              account or password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact number</Label>
                <Input
                  id="contact"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="h-12 rounded-2xl border-2 border-black/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender identity</Label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as ProfileGender)}
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
                <Label>Skill level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(v) => setSkillLevel(v as PlayerSkillLevel)}
                >
                  <SelectTrigger className="h-12 w-full rounded-2xl border-2 border-black/10">
                    <SelectValue />
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
              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-sisclub-green font-bold text-white"
              >
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lost your session link?{" "}
          <Link
            href="/dashboard"
            className="font-medium text-sisclub-green underline-offset-2 hover:underline"
          >
            Find it on the schedule
          </Link>{" "}
          and use &quot;Find my registration&quot; on your status page.
        </p>
      </div>
    </PageShell>
  );
}
