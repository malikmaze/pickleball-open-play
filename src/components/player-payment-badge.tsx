import { isPlayerPaid } from "@/lib/player-payment";
import type { Player } from "@/types";
import { cn } from "@/lib/utils";

export function PlayerPaymentBadge({
  player,
  className,
}: {
  player: Pick<Player, "securedAt" | "status">;
  className?: string;
}) {
  if (player.status === "Waitlisted") return null;

  const paid = isPlayerPaid(player);

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
        className
      )}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}
