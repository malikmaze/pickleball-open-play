"use client";

import { Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPartnerDisplayName,
  listMutualPairs,
  partnerOptionsFor,
} from "@/lib/player-partners";
import type { Player } from "@/types";

const NONE = "__none__";

export function AdminPartnerPanel({
  players,
  onPartnerChange,
  disabled,
}: {
  players: Player[];
  onPartnerChange: (playerId: string, partnerId: string | null) => void;
  disabled?: boolean;
}) {
  const manageable = players.filter((p) => p.status !== "Waitlisted");
  const pairs = listMutualPairs(manageable);

  return (
    <Card className="rounded-3xl border-2 border-black/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Partner pairs</CardTitle>
        <CardDescription>
          Link players who want to play together. Pairs stay on the same team
          when you assign matches. Change anytime before they play.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pairs.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
        )}

        {manageable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No admitted players yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {manageable.map((player) => {
              const options = partnerOptionsFor(player.id, manageable);
              const current = player.partnerId ?? NONE;
              const partnerItems: Record<string, string> = {
                [NONE]: "No partner",
              };
              for (const option of options) {
                partnerItems[option.id] = option.name;
              }
              if (player.partnerId && !partnerItems[player.partnerId]) {
                const linked = manageable.find((p) => p.id === player.partnerId);
                if (linked) partnerItems[linked.id] = linked.name;
              }

              return (
                <div
                  key={player.id}
                  className="space-y-1.5 rounded-2xl border border-black/5 bg-white/70 p-3"
                >
                  <Label className="text-sm font-semibold text-sisclub-green-dark">
                    {player.name}
                  </Label>
                  <Select
                    value={current}
                    items={partnerItems}
                    disabled={disabled}
                    onValueChange={(value) =>
                      onPartnerChange(
                        player.id,
                        value === NONE ? null : value
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-full rounded-full border-2 border-black/10">
                      <SelectValue placeholder="No partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No partner</SelectItem>
                      {options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {player.partnerId && (
                    <p className="text-xs text-muted-foreground">
                      {getPartnerDisplayName(player, manageable)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
