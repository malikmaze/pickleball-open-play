import type { PlayerStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<PlayerStatus, string> = {
  Registered: "bg-slate-100 text-slate-700 border-slate-200",
  Secured: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Present: "bg-sisclub-green/15 text-sisclub-green border-sisclub-green/30",
  Waiting: "bg-amber-50 text-amber-700 border-amber-200",
  Playing: "bg-blue-50 text-blue-700 border-blue-200",
  Finished: "bg-purple-50 text-purple-700 border-purple-200",
  "No Show": "bg-red-50 text-red-600 border-red-200",
};

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </Badge>
  );
}
