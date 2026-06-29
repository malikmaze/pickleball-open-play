"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_SKILL_LEVELS } from "@/lib/constants";
import {
  mergeImportNote,
  parsePlayerImportLines,
  BULK_IMPORT_SOURCE_NOTE,
} from "@/lib/player-import";
import { createClient } from "@/utils/supabase/client";
import { importPlayersRecord } from "@/utils/supabase/queries";
import type { PlayerSkillLevel, Session } from "@/types";

export function ImportPlayersDialog({
  open,
  onOpenChange,
  session,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [defaultSkill, setDefaultSkill] = useState<PlayerSkillLevel>("Novice");
  const [markPaid, setMarkPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parsePlayerImportLines(text), [text]);
  const previewCount = parsed.length;

  const reset = () => {
    setText("");
    setDefaultSkill("Novice");
    setMarkPaid(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.length === 0) {
      toast.error("Paste at least one player name");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const result = await importPlayersRecord(
        supabase,
        session.id,
        parsed.map((row) => ({
          name: row.name,
          contactNumber: row.contactNumber,
          skillLevel: row.skillLevel ?? defaultSkill,
          note: mergeImportNote(undefined, BULK_IMPORT_SOURCE_NOTE),
        })),
        {
          checkIn: false,
          paymentConfirmed: markPaid,
        }
      );

      const parts = [`${result.added} added`];
      if (result.checkedIn > 0) parts.push(`${result.checkedIn} checked in`);
      if (result.waitlisted > 0) parts.push(`${result.waitlisted} waitlisted`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped (duplicate)`);

      if (result.added === 0 && result.errors.length === 0) {
        toast.info("No new players to import — all names already on the list");
      } else {
        toast.success(parts.join(" · "));
      }

      if (result.errors.length > 0) {
        toast.error(result.errors.slice(0, 3).join("\n"));
      }

      reset();
      onOpenChange(false);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-black/10 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-sisclub-green-dark">
            Bulk import
          </DialogTitle>
          <DialogDescription>
            Paste a list — one name per line. Works with booking apps,
            spreadsheets, or chat exports. Players are booked only; check them
            in on the Check-in tab when they arrive.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-players">Player list</Label>
            <textarea
              id="import-players"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Maria Santos\nJuan Cruz, 09171234567\nAna Reyes, Intermediate Low`}
              rows={8}
              className="w-full resize-y rounded-2xl border-2 border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="text-xs text-muted-foreground">
              {previewCount === 0
                ? "No players detected yet"
                : `${previewCount} player${previewCount === 1 ? "" : "s"} ready to import`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Default skill (when not specified)</Label>
            <Select
              value={defaultSkill}
              onValueChange={(v) => v && setDefaultSkill(v as PlayerSkillLevel)}
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

          <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-black/10 bg-muted/30 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
            />
            <span>
              <span className="font-medium">All already paid</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Leave off for unpaid by default — mark individuals later on the
                roster.
              </span>
            </span>
          </label>

          <Button
            type="submit"
            disabled={saving || previewCount === 0}
            className="w-full rounded-full bg-sisclub-green font-bold hover:bg-sisclub-green-dark"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              `Import ${previewCount || ""} player${previewCount === 1 ? "" : "s"}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
