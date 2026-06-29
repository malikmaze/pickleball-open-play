"use client";

import { useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
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
  DEFAULT_PROFILE_GENDER,
  PLAYER_SKILL_LEVELS,
  PROFILE_GENDERS,
} from "@/lib/constants";
import {
  findExistingPlayerByName,
  WALK_IN_SOURCE_NOTE,
} from "@/lib/player-import";
import { countAdmittedPlayers, getAvailableSpots } from "@/lib/waitlist";
import { createClient } from "@/utils/supabase/client";
import { adminAddPlayerRecord } from "@/utils/supabase/queries";
import { adminBtnPrimary } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import type { Player, PlayerSkillLevel, ProfileGender, Session } from "@/types";

const genderItems = Object.fromEntries(
  PROFILE_GENDERS.map((g) => [g, g])
);

export function WalkInQuickAdd({
  session,
  players,
  onAdded,
}: {
  session: Session;
  players: Player[];
  onAdded: () => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>("Newbie");
  const [gender, setGender] = useState<ProfileGender>(DEFAULT_PROFILE_GENDER);
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  const admitted = countAdmittedPlayers(players);
  const spotsLeft = getAvailableSpots(admitted, session.maxPlayers);
  const duplicate = name.trim()
    ? findExistingPlayerByName(players, name)
    : null;

  const resetName = () => {
    setName("");
    setPaid(false);
    nameRef.current?.focus();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a name");
      nameRef.current?.focus();
      return;
    }

    if (duplicate) {
      toast.error(`${duplicate.name} is already on this session`);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { waitlisted } = await adminAddPlayerRecord(
        supabase,
        session.id,
        {
          name: trimmed,
          skillLevel,
          gender,
          note: WALK_IN_SOURCE_NOTE,
        },
        {
          checkIn: true,
          paymentConfirmed: paid,
        }
      );

      if (waitlisted) {
        toast.success(`${trimmed} added to waitlist`);
      } else {
        toast.success(
          `${trimmed} checked in${paid ? " · paid" : " · unpaid"}`
        );
      }

      resetName();
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add walk-in");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-sisclub-green/25 bg-gradient-to-br from-sisclub-green/8 to-white p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 font-heading text-base font-bold text-sisclub-green-dark">
          <UserPlus className="h-4 w-4" />
          Walk-in check-in
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Player is on-site — add and check in to the queue in one step.
          {spotsLeft > 0
            ? ` ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`
            : " Session full — walk-ins go to the waitlist."}
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,10rem))] lg:items-end">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="walkin-quick-name">Name</Label>
            <Input
              ref={nameRef}
              id="walkin-quick-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              autoComplete="off"
              className="rounded-2xl border-2 border-black/10 bg-white"
            />
            {duplicate && (
              <p className="text-xs text-amber-700">
                Already on list ({duplicate.status}) — use Check in below.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Skill</Label>
            <Select
              value={skillLevel}
              onValueChange={(v) => v && setSkillLevel(v as PlayerSkillLevel)}
            >
              <SelectTrigger className="w-full rounded-2xl border-2 border-black/10 bg-white">
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

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select
              value={gender}
              items={genderItems}
              onValueChange={(v) => v && setGender(v as ProfileGender)}
            >
              <SelectTrigger className="w-full rounded-2xl border-2 border-black/10 bg-white">
                <SelectValue />
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
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
            />
            <span>Payment collected</span>
          </label>

          <Button
            type="submit"
            disabled={saving || !name.trim() || !!duplicate}
            className={cn(adminBtnPrimary, "sm:min-w-[10rem]")}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add & check in"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
