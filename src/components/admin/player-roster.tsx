"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PlayerPaymentBadge } from "@/components/player-payment-badge";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_SKILL_LEVELS, PROFILE_GENDERS } from "@/lib/constants";
import { isPlayerPaid } from "@/lib/player-payment";
import type { Player, PlayerSkillLevel, ProfileGender } from "@/types";

type RosterMode = "booked" | "checkin";
type StatusFilter = "all" | "pending" | "present" | "playing";

const genderItems = Object.fromEntries(
  PROFILE_GENDERS.map((g) => [g, g])
);
const skillItems = Object.fromEntries(
  PLAYER_SKILL_LEVELS.map((l) => [l, l])
);

interface PlayerRosterProps {
  players: Player[];
  mode: RosterMode;
  onStatus: (id: string, action: "present" | "noshow") => void;
  onPayment: (id: string, paid: boolean) => void;
  onRemove: (id: string) => void;
  onSkillChange: (id: string, skill: PlayerSkillLevel) => void;
  onGenderChange?: (id: string, gender: ProfileGender) => void;
  onBulkPresent?: (ids: string[]) => void;
  bulkLoading?: boolean;
}

function matchesFilter(
  player: Player,
  filter: StatusFilter,
  mode: RosterMode
): boolean {
  if (filter === "all") {
    if (mode === "booked") {
      return ["Registered", "Secured", "Waitlisted"].includes(player.status);
    }
    return true;
  }
  if (filter === "pending") {
    return player.status === "Registered" || player.status === "Secured";
  }
  if (filter === "present") {
    return player.status === "Present" || player.status === "Waiting";
  }
  if (filter === "playing") return player.status === "Playing";
  return true;
}

export function PlayerRoster({
  players,
  mode,
  onStatus,
  onPayment,
  onRemove,
  onSkillChange,
  onGenderChange,
  onBulkPresent,
  bulkLoading,
}: PlayerRosterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    mode === "checkin" ? "pending" : "all"
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((player) => {
      if (!matchesFilter(player, statusFilter, mode)) return false;
      if (!q) return true;
      return (
        player.name.toLowerCase().includes(q) ||
        (player.contactNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [players, search, statusFilter, mode]);

  const pendingIds = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "Registered" || p.status === "Secured")
        .map((p) => p.id),
    [filtered]
  );

  const emptyCopy =
    mode === "booked"
      ? players.length === 0
        ? "No bookings yet — bulk import a list or add a name."
        : "No bookings match your search."
      : players.length === 0
        ? "No one to check in yet."
        : "No players match your search.";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or contact…"
            className="rounded-full border-2 border-black/10 pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          items={{
            all: mode === "booked" ? "All bookings" : "All",
            pending: "Awaiting check-in",
            present: "In queue",
            playing: "On court",
          }}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full rounded-full border-2 border-black/10 sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {mode === "booked" ? "All bookings" : "All"}
            </SelectItem>
            <SelectItem value="pending">Awaiting check-in</SelectItem>
            <SelectItem value="present">In queue</SelectItem>
            <SelectItem value="playing">On court</SelectItem>
          </SelectContent>
        </Select>
        {mode === "checkin" && onBulkPresent && pendingIds.length > 0 && (
          <Button
            type="button"
            disabled={bulkLoading}
            onClick={() => onBulkPresent(pendingIds)}
            className="rounded-full bg-sisclub-green font-semibold hover:bg-sisclub-green-dark"
          >
            Check in all ({pendingIds.length})
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((player) => {
            const waitLabel = player.checkedInAt
              ? `checked in ${new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : `booked ${new Date(player.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

            const paid = isPlayerPaid(player);
            const canCheckIn =
              player.status === "Registered" || player.status === "Secured";

            return (
              <Card
                key={player.id}
                className="rounded-2xl border-2 border-black/10"
              >
                <CardContent className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sisclub-green-dark">
                        {player.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {player.contactNumber || "No contact"} ·{" "}
                        {player.skillLevel}
                        {player.gender ? ` · ${player.gender}` : ""} ·{" "}
                        {waitLabel}
                      </p>
                      {player.note && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          {player.note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PlayerPaymentBadge player={player} />
                      {mode !== "checkin" && (
                        <PlayerStatusBadge status={player.status} />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mode === "checkin" && canCheckIn && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
                          onClick={() => onStatus(player.id, "present")}
                        >
                          Check in
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => onStatus(player.id, "noshow")}
                        >
                          No show
                        </Button>
                      </>
                    )}

                    {mode === "booked" && player.status === "Waitlisted" && (
                      <span className="text-xs text-muted-foreground">
                        On waitlist
                      </span>
                    )}

                    {!paid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={player.status === "Waitlisted"}
                        onClick={() => onPayment(player.id, true)}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => onPayment(player.id, false)}
                      >
                        Mark unpaid
                      </Button>
                    )}

                    <Select
                      value={player.skillLevel}
                      items={skillItems}
                      onValueChange={(v) =>
                        onSkillChange(player.id, v as PlayerSkillLevel)
                      }
                    >
                      <SelectTrigger className="h-9 w-full rounded-full sm:h-8 sm:w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYER_SKILL_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {onGenderChange && (
                      <Select
                        value={player.gender ?? "Others"}
                        items={genderItems}
                        onValueChange={(v) =>
                          v && onGenderChange(player.id, v as ProfileGender)
                        }
                      >
                        <SelectTrigger className="h-9 w-full rounded-full sm:h-8 sm:w-36">
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
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => onRemove(player.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
