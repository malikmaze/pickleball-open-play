"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_SKILL_LEVELS } from "@/lib/constants";
import type { Player, PlayerSkillLevel, Session } from "@/types";

type StatusFilter = "all" | "pending" | "present" | "playing";

interface PlayerRosterProps {
  players: Player[];
  mode: "registrations" | "checkin";
  session: Session;
  onStatus: (id: string, action: "present" | "secured" | "noshow") => void;
  onRemove: (id: string) => void;
  onSkillChange: (id: string, skill: PlayerSkillLevel) => void;
  onBulkPresent?: (ids: string[]) => void;
  bulkLoading?: boolean;
}

function matchesFilter(player: Player, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pending") {
    return player.status === "Registered" || player.status === "Secured";
  }
  if (filter === "present") {
    return (
      player.status === "Present" ||
      player.status === "Waiting" ||
      player.status === "Secured"
    );
  }
  if (filter === "playing") return player.status === "Playing";
  return true;
}

export function PlayerRoster({
  players,
  mode,
  session,
  onStatus,
  onRemove,
  onSkillChange,
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
      if (!matchesFilter(player, statusFilter)) return false;
      if (!q) return true;
      return (
        player.name.toLowerCase().includes(q) ||
        (player.contactNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [players, search, statusFilter]);

  const pendingIds = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "Registered" || p.status === "Secured")
        .map((p) => p.id),
    [filtered]
  );

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
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full rounded-full border-2 border-black/10 sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Not checked in</SelectItem>
            <SelectItem value="present">Checked in / waiting</SelectItem>
            <SelectItem value="playing">Playing</SelectItem>
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
        <p className="text-sm text-muted-foreground">
          {players.length === 0
            ? "No one has joined yet."
            : "No players match your search."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((player) => {
            const waitLabel = player.checkedInAt
              ? `checked in ${new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : `joined ${new Date(player.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

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
                        {player.gamesPlayed} games · {waitLabel}
                      </p>
                      {player.note && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          {player.note}
                        </p>
                      )}
                    </div>
                    <PlayerStatusBadge status={player.status} />
                  </div>
                  {mode === "checkin" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={
                          player.status === "Present" ||
                          player.status === "Waiting" ||
                          player.status === "Playing"
                        }
                        onClick={() => onStatus(player.id, "present")}
                      >
                        Present
                      </Button>
                      {session.paymentRequired && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => onStatus(player.id, "secured")}
                        >
                          Secured
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => onStatus(player.id, "noshow")}
                      >
                        No Show
                      </Button>
                      <Select
                        value={player.skillLevel}
                        onValueChange={(v) =>
                          onSkillChange(player.id, v as PlayerSkillLevel)
                        }
                      >
                        <SelectTrigger className="h-9 w-full rounded-full sm:h-8 sm:w-40">
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
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => onRemove(player.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {mode === "registrations" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => onRemove(player.id)}
                      >
                        Remove from session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
