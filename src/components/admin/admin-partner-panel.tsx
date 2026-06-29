"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Heart, Search } from "lucide-react";
import { AdminSection } from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMutualPartner,
  getPartnerDisplayName,
  listMutualPairs,
  partnerSelectOptionsFor,
} from "@/lib/player-partners";
import { cn } from "@/lib/utils";
import type { Player } from "@/types";

const NONE = "__none__";

/** Shared max height for Queue tab side-by-side panels. */
export const adminQueuePanelHeight =
  "max-h-[min(52vh,440px)] xl:max-h-[min(70vh,640px)]";

function PartnerPlayerRow({
  player,
  manageable,
  disabled,
  onPartnerChange,
}: {
  player: Player;
  manageable: Player[];
  disabled?: boolean;
  onPartnerChange: (playerId: string, partnerId: string | null) => void;
}) {
  const options = partnerSelectOptionsFor(player.id, manageable);
  const available = options.filter((o) => !o.disabled);
  const taken = options.filter((o) => o.disabled);
  const current = player.partnerId ?? NONE;
  const mutual = getMutualPartner(player, manageable);

  const partnerItems: Record<string, string> = {
    [NONE]: "No partner",
  };
  for (const option of options) {
    partnerItems[option.id] = option.note
      ? `${option.name} (${option.note})`
      : option.name;
  }
  if (player.partnerId && !partnerItems[player.partnerId]) {
    const linked = manageable.find((p) => p.id === player.partnerId);
    if (linked) partnerItems[linked.id] = linked.name;
  }

  return (
    <div
      className={cn(
        "space-y-1.5 rounded-2xl border p-3",
        mutual
          ? "border-pink-200/60 bg-pink-50/40"
          : "border-black/5 bg-white/70"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-sisclub-green-dark">
          {player.name}
        </Label>
        {mutual && (
          <Heart className="h-3.5 w-3.5 shrink-0 fill-pink-300 text-pink-400" />
        )}
      </div>
      <Select
        value={current}
        items={partnerItems}
        disabled={disabled}
        onValueChange={(value) =>
          onPartnerChange(player.id, value === NONE ? null : value)
        }
      >
        <SelectTrigger className="h-9 w-full rounded-full border-2 border-black/10">
          <SelectValue placeholder="No partner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>No partner</SelectItem>
          {available.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
          {taken.length > 0 && (
            <SelectGroup>
              <SelectSeparator className="my-1" />
              <SelectLabel>Already linked</SelectLabel>
              {taken.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  disabled
                  className="text-muted-foreground"
                >
                  <span className="flex flex-col gap-0.5">
                    <span>{option.name}</span>
                    {option.note && (
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {option.note}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      {player.partnerId && !mutual && (
        <p className="text-xs text-amber-700">
          {getPartnerDisplayName(player, manageable)}
        </p>
      )}
    </div>
  );
}

export function AdminPartnerPanel({
  players,
  onPartnerChange,
  disabled,
  compact = false,
  fillHeight = false,
}: {
  players: Player[];
  onPartnerChange: (playerId: string, partnerId: string | null) => void;
  disabled?: boolean;
  /** Sidebar layout — collapsible with search and filters */
  compact?: boolean;
  /** Fixed-height panel with scrollable player list */
  fillHeight?: boolean;
}) {
  const manageable = players.filter((p) => p.status !== "Waitlisted");
  const pairs = listMutualPairs(manageable);
  const unpairedCount = manageable.filter(
    (p) => !getMutualPartner(p, manageable)
  ).length;

  const [expanded, setExpanded] = useState(
    () => pairs.length > 0 || manageable.length <= 6
  );
  const [search, setSearch] = useState("");
  const [unpairedOnly, setUnpairedOnly] = useState(true);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return manageable.filter((player) => {
      if (unpairedOnly && getMutualPartner(player, manageable)) return false;
      if (!q) return true;
      return player.name.toLowerCase().includes(q);
    });
  }, [manageable, search, unpairedOnly]);

  const pairChips =
    pairs.length > 0 ? (
      <div className="mb-4 flex flex-wrap gap-2">
        {pairs.map(({ a, b }) => (
          <span
            key={`${a.id}-${b.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-pink-200/80 bg-pink-50 px-3 py-1.5 text-sm font-medium text-pink-800"
          >
            <Heart className="h-3.5 w-3.5 fill-pink-300 text-pink-400" />
            {a.name} & {b.name}
          </span>
        ))}
      </div>
    ) : null;

  const searchFilters =
    compact && manageable.length > 4 ? (
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
            className="rounded-full border-2 border-black/10 pl-9"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unpairedOnly}
            onChange={(e) => setUnpairedOnly(e.target.checked)}
            className="h-4 w-4 accent-sisclub-green"
          />
          Show unpaired only
        </label>
      </div>
    ) : null;

  const playerList =
    manageable.length === 0 ? (
      <p className="text-sm text-muted-foreground">No admitted players yet.</p>
    ) : filteredPlayers.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        {unpairedOnly
          ? "Everyone is paired. Uncheck “Show unpaired only” to edit links."
          : "No players match your search."}
      </p>
    ) : (
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"
        )}
      >
        {filteredPlayers.map((player) => (
          <PartnerPlayerRow
            key={player.id}
            player={player}
            manageable={manageable}
            disabled={disabled}
            onPartnerChange={onPartnerChange}
          />
        ))}
      </div>
    );

  const panelBody = fillHeight ? (
    <>
      {(pairChips || searchFilters) && (
        <div className="shrink-0">
          {pairChips}
          {searchFilters}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {playerList}
      </div>
    </>
  ) : (
    <>
      {pairChips}
      {searchFilters}
      {playerList}
    </>
  );

  if (!compact) {
    return (
      <AdminSection
        title="Partner pairs"
        description="Link players who want to play together. Players already paired with someone else cannot be selected."
      >
        {panelBody}
      </AdminSection>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border-2 border-black/10 bg-white shadow-sm",
        fillHeight && cn("flex flex-col", adminQueuePanelHeight)
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-sisclub-green-dark">
            Partner links
          </p>
          <p className="text-xs text-muted-foreground">
            {pairs.length} pair{pairs.length === 1 ? "" : "s"} · {unpairedCount}{" "}
            unpaired
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div
          className={cn(
            "border-t border-black/5 px-4 pb-4 pt-3",
            fillHeight && "flex min-h-0 flex-1 flex-col"
          )}
        >
          {panelBody}
        </div>
      )}
    </div>
  );
}
