import type { SessionStatus, SkillLevel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-sisclub-green/15 text-sisclub-green border-sisclub-green/30",
  },
  full: {
    label: "Full",
    className: "bg-sisclub-pink/20 text-sisclub-pink-dark border-sisclub-pink/40",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const skillConfig: Record<SkillLevel, string> = {
  Beginner: "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-purple-50 text-purple-700 border-purple-200",
  Mixed: "bg-sisclub-pink-soft text-sisclub-green-dark border-sisclub-pink/30",
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-semibold", config.className)}
    >
      {config.label}
    </Badge>
  );
}

export function SkillBadge({ level }: { level: SkillLevel }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-medium", skillConfig[level])}
    >
      {level}
    </Badge>
  );
}
