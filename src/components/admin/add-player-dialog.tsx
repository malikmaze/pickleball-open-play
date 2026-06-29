"use client";

import { useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContactNumberInput } from "@/components/contact-number-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  findExistingPlayerByName,
  mergeImportNote,
  WALK_IN_SOURCE_NOTE,
} from "@/lib/player-import";
import { getPhilippineMobileError, parsePhilippineMobile } from "@/lib/phone";
import { countAdmittedPlayers, getAvailableSpots } from "@/lib/waitlist";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { adminAddPlayerRecord } from "@/utils/supabase/queries";
import type { Player, PlayerSkillLevel, ProfileGender, Session } from "@/types";

const genderItems = Object.fromEntries(
  PROFILE_GENDERS.map((g) => [g, g])
);

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  players: Player[];
  mode?: "walkin" | "register";
  onAdded: () => void;
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  session,
  players,
  mode = "register",
  onAdded,
}: AddPlayerDialogProps) {
  const isWalkIn = mode === "walkin";
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState<ProfileGender>(DEFAULT_PROFILE_GENDER);
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>("Novice");
  const [note, setNote] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(!isWalkIn);
  const [contactError, setContactError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const admitted = countAdmittedPlayers(players);
  const spotsLeft = getAvailableSpots(admitted, session.maxPlayers);
  const duplicate = name.trim()
    ? findExistingPlayerByName(players, name)
    : null;

  const reset = () => {
    setName("");
    setContactNumber("");
    setGender(DEFAULT_PROFILE_GENDER);
    setSkillLevel("Novice");
    setNote("");
    setPaymentConfirmed(false);
    setShowDetails(!isWalkIn);
    setContactError(null);
  };

  const resolveCheckIn = () => (isWalkIn ? true : false);
  const resolvePaid = () => paymentConfirmed;

  const addPlayer = async (addAnother: boolean) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    if (duplicate) {
      toast.error(`${duplicate.name} is already on this session`);
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
      const sourceNote = isWalkIn ? WALK_IN_SOURCE_NOTE : undefined;
      const { waitlisted, status } = await adminAddPlayerRecord(
        supabase,
        session.id,
        {
          name: trimmed,
          contactNumber: normalizedContact,
          gender,
          skillLevel,
          note: mergeImportNote(note.trim() || undefined, sourceNote),
        },
        {
          checkIn: resolveCheckIn(),
          paymentConfirmed: resolvePaid(),
        }
      );

      if (waitlisted) {
        toast.success(`${trimmed} added to waitlist`);
      } else if (status === "Present") {
        toast.success(`${trimmed} checked in and added to queue`);
      } else if (status === "Secured") {
        toast.success(`${trimmed} added — payment confirmed`);
      } else {
        toast.success(`${trimmed} added to booked list`);
      }

      onAdded();

      if (addAnother) {
        reset();
        requestAnimationFrame(() => nameRef.current?.focus());
      } else {
        reset();
        onOpenChange(false);
      }
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
        if (next) {
          setPaymentConfirmed(false);
          setShowDetails(!isWalkIn);
          requestAnimationFrame(() => nameRef.current?.focus());
        } else {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-black/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-sisclub-green-dark">
            {isWalkIn ? "Walk-in" : "Add booking"}
          </DialogTitle>
          <DialogDescription>
            {isWalkIn
              ? "On-site player — checked in to the queue immediately."
              : "Sign-up only — player is not in the queue until checked in on the Check-in tab."}
            {spotsLeft > 0
              ? ` ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} available.`
              : " Session full — new names go to the waitlist."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walkin-name">Name *</Label>
            <Input
              ref={nameRef}
              id="walkin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="off"
              className="rounded-2xl border-2 border-black/10"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isWalkIn && !showDetails) {
                  e.preventDefault();
                  void addPlayer(true);
                }
              }}
            />
            {duplicate && (
              <p className="text-xs text-amber-700">
                {duplicate.name} is already on the list ({duplicate.status}).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Skill level</Label>
            <Select
              value={skillLevel}
              onValueChange={(v) => v && setSkillLevel(v as PlayerSkillLevel)}
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
            <Label>Gender</Label>
            <Select
              value={gender}
              items={genderItems}
              onValueChange={(v) => v && setGender(v as ProfileGender)}
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

          {isWalkIn && (
            <button
              type="button"
              className="flex w-full items-center gap-1 text-sm font-medium text-sisclub-green-dark"
              onClick={() => setShowDetails((v) => !v)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showDetails && "rotate-180"
                )}
              />
              {showDetails ? "Hide optional fields" : "Contact & note…"}
            </button>
          )}

          {(showDetails || !isWalkIn) && (
            <>
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
                <Label htmlFor="walkin-note">Note</Label>
                <Input
                  id="walkin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional — e.g. partner name"
                  className="rounded-2xl border-2 border-black/10"
                />
              </div>
            </>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-black/10 bg-muted/30 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={paymentConfirmed}
              onChange={(e) => setPaymentConfirmed(e.target.checked)}
            />
            <span>
              <span className="font-medium">Payment collected</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {isWalkIn
                  ? "Unchecked = unpaid — you can collect payment later."
                  : "Unchecked = unpaid by default for this booking."}
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            disabled={saving || !name.trim() || !!duplicate}
            onClick={() => void addPlayer(false)}
            className="w-full rounded-full bg-sisclub-green font-bold hover:bg-sisclub-green-dark"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isWalkIn ? (
              "Add & check in"
            ) : (
              "Add booking"
            )}
          </Button>
          {isWalkIn && (
            <Button
              type="button"
              variant="outline"
              disabled={saving || !name.trim() || !!duplicate}
              onClick={() => void addPlayer(true)}
              className="w-full rounded-full border-2 border-black/10"
            >
              Add & check in another
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
