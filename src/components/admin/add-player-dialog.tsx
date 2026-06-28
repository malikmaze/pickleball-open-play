"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContactNumberInput } from "@/components/contact-number-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getPhilippineMobileError, parsePhilippineMobile } from "@/lib/phone";
import { createClient } from "@/utils/supabase/client";
import { registerPlayerRecord } from "@/utils/supabase/queries";
import type { PlayerSkillLevel, ProfileGender } from "@/types";

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onAdded: () => void;
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  sessionId,
  onAdded,
}: AddPlayerDialogProps) {
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState<ProfileGender>(DEFAULT_PROFILE_GENDER);
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>("Novice");
  const [note, setNote] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setContactNumber("");
    setGender(DEFAULT_PROFILE_GENDER);
    setSkillLevel("Novice");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (contactNumber.trim()) {
      const mobileError = getPhilippineMobileError(contactNumber);
      if (mobileError) {
        toast.error(mobileError);
        setContactError(mobileError);
        return;
      }
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const normalizedContact = contactNumber.trim()
        ? parsePhilippineMobile(contactNumber)!
        : undefined;
      const { waitlisted } = await registerPlayerRecord(supabase, sessionId, {
        name: name.trim(),
        contactNumber: normalizedContact,
        gender,
        skillLevel,
        note: note.trim() || undefined,
      });
      toast.success(
        waitlisted
          ? `${name.trim()} added to waitlist`
          : `${name.trim()} added to session`
      );
      reset();
      onOpenChange(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add player");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-black/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-sisclub-green-dark">
            Add walk-in player
          </DialogTitle>
          <DialogDescription>
            Register someone on-site. They go on the waitlist if the session is
            full.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walkin-name">Name *</Label>
            <Input
              id="walkin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border-2 border-black/10"
              required
            />
          </div>
          <ContactNumberInput
            id="walkin-contact"
            label="Contact"
            value={contactNumber}
            onChange={(value) => {
              setContactNumber(value);
              setContactError(null);
            }}
            error={contactError}
            hint="Optional. Philippine mobile only (09XX XXX XXXX)."
            inputClassName="rounded-2xl border-2 border-black/10"
          />
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={gender}
              onValueChange={(v) => setGender(v as ProfileGender)}
            >
              <SelectTrigger className="rounded-2xl border-2 border-black/10">
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
          <div className="space-y-2">
            <Label>Skill level</Label>
            <Select
              value={skillLevel}
              onValueChange={(v) => setSkillLevel(v as PlayerSkillLevel)}
            >
              <SelectTrigger className="rounded-2xl border-2 border-black/10">
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
          <div className="space-y-2">
            <Label htmlFor="walkin-note">Note</Label>
            <Input
              id="walkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-2xl border-2 border-black/10"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-sisclub-green font-bold hover:bg-sisclub-green-dark"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              "Add player"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
