"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PlayerPaymentBadge } from "@/components/player-payment-badge";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { BulkSelectBar } from "@/components/admin/bulk-select-bar";
import {
  AdminSection,
  adminBtnOutline,
  adminBtnPrimary,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
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
import {
  playerCanBulkSelect,
  type PlayerRemoveContext,
} from "@/lib/player-remove";
import type { Player, PlayerSkillLevel, ProfileGender } from "@/types";

type RosterMode = "booked" | "checkin";
type StatusFilter = "all" | "pending" | "present" | "playing";

const genderItems = Object.fromEntries(
  PROFILE_GENDERS.map((g) => [g, g])
);

interface PlayerRosterProps {
  players: Player[];
  mode: RosterMode;
  onStatus: (id: string, action: "present" | "noshow") => void;
  onPayment: (id: string, paid: boolean) => void;
  onRemove: (id: string) => void;
  onBulkRemove?: (ids: string[]) => void;
  removeContext: PlayerRemoveContext;
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
  onBulkRemove,
  removeContext,
  onSkillChange,
  onGenderChange,
  onBulkPresent,
  bulkLoading,
}: PlayerRosterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    mode === "checkin" ? "pending" : "all"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const selectableIds = useMemo(
    () =>
      filtered
        .filter((p) => playerCanBulkSelect(p, removeContext))
        .map((p) => p.id),
    [filtered, removeContext]
  );

  const selectedInView = useMemo(
    () => new Set([...selected].filter((id) => selectableIds.includes(id))),
    [selected, selectableIds]
  );

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(selectableIds) : new Set());
  };

  const emptyCopy =
    mode === "booked"
      ? players.length === 0
        ? "No bookings yet — bulk import a list or add a name."
        : "No bookings match your search."
      : players.length === 0
        ? "No one to check in yet."
        : "No players match your search.";

  const title = mode === "booked" ? "Player roster" : "Check-in list";
  const description =
    mode === "booked"
      ? `${filtered.length} of ${players.length} bookings shown`
      : `${filtered.length} players · filter to find who still needs check-in`;

  return (
    <AdminSection title={title} description={description}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(new Set());
            }}
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
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setSelected(new Set());
          }}
        >
          <SelectTrigger className="w-full rounded-full border-2 border-black/10 lg:w-44">
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
            className={adminBtnPrimary}
          >
            Check in all ({pendingIds.length})
          </Button>
        )}
      </div>

      {onBulkRemove && filtered.length > 0 && (
        <BulkSelectBar
          selectedCount={selectedInView.size}
          totalSelectable={selectableIds.length}
          onSelectAll={handleSelectAll}
          onClear={() => setSelected(new Set())}
          onRemove={() => onBulkRemove([...selectedInView])}
          removeLoading={bulkLoading}
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5">
          <div
            className={
              onBulkRemove
                ? "hidden grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-black/5 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid"
                : "hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-black/5 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid"
            }
          >
            {onBulkRemove && <span />}
            <span>Player</span>
            <span>Details</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-black/5">
            {filtered.map((player) => {
              const waitLabel = player.checkedInAt
                ? `Checked in ${new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : `Booked ${new Date(player.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

              const paid = isPlayerPaid(player);
              const canCheckIn =
                player.status === "Registered" || player.status === "Secured";
              const canSelect =
                onBulkRemove && playerCanBulkSelect(player, removeContext);

              return (
                <div
                  key={player.id}
                  className={
                    onBulkRemove
                      ? "grid gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center"
                      : "grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center"
                  }
                >
                  {onBulkRemove && (
                    <div className="flex items-start pt-0.5 md:items-center md:pt-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sisclub-green disabled:opacity-40"
                        checked={selectedInView.has(player.id)}
                        disabled={!canSelect}
                        title={
                          !canSelect
                            ? "Cannot remove while on court"
                            : undefined
                        }
                        onChange={() => toggleSelected(player.id)}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sisclub-green-dark">
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {player.contactNumber || "No contact"} · {waitLabel}
                    </p>
                    {player.note && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        {player.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="hidden md:inline">
                      {player.contactNumber || "No contact"}
                    </span>
                    <span className="hidden md:inline">·</span>
                    <span>{player.skillLevel}</span>
                    {player.gender && (
                      <>
                        <span>·</span>
                        <span>{player.gender}</span>
                      </>
                    )}
                    <span className="hidden md:inline">· {waitLabel}</span>
                    <PlayerPaymentBadge player={player} />
                    {mode !== "checkin" && (
                      <PlayerStatusBadge status={player.status} />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {mode === "checkin" && canCheckIn && (
                      <>
                        <Button
                          size="sm"
                          className={adminBtnPrimary}
                          onClick={() => onStatus(player.id, "present")}
                        >
                          Check in
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={adminBtnOutline}
                          onClick={() => onStatus(player.id, "noshow")}
                        >
                          No show
                        </Button>
                      </>
                    )}

                    {mode === "booked" && player.status === "Waitlisted" && (
                      <span className="self-center text-xs text-muted-foreground">
                        Waitlist
                      </span>
                    )}

                    {!paid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className={adminBtnOutline}
                        disabled={player.status === "Waitlisted"}
                        onClick={() => onPayment(player.id, true)}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className={adminBtnOutline}
                        onClick={() => onPayment(player.id, false)}
                      >
                        Unpaid
                      </Button>
                    )}

                    <Select
                      value={player.skillLevel}
                      onValueChange={(v) => {
                        if (!v) return;
                        onSkillChange(player.id, v as PlayerSkillLevel);
                      }}
                    >
                      <SelectTrigger className="h-8 w-full rounded-full sm:w-32">
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
                        <SelectTrigger className="h-8 w-full rounded-full sm:w-28">
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
                      disabled={player.status === "Playing"}
                      title={
                        player.status === "Playing"
                          ? "Clear the court before removing this player"
                          : undefined
                      }
                      onClick={() => onRemove(player.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminSection>
  );
}
