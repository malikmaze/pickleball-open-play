import type { PlayerSkillLevel, SessionSkillLevel, SessionStatus } from "@/types";
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

const sessionSkillConfig: Record<SessionSkillLevel, string> = {
  Beginner: "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-purple-50 text-purple-700 border-purple-200",
  Mixed: "bg-sisclub-pink-soft text-sisclub-green-dark border-sisclub-pink/30",
};

const playerSkillConfig: Record<PlayerSkillLevel, string> = {
  Beginner: "bg-blue-50 text-blue-700 border-blue-200",
  Novice: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Intermediate Low": "bg-amber-50 text-amber-700 border-amber-200",
  "Intermediate High": "bg-orange-50 text-orange-700 border-orange-200",
  Advanced: "bg-purple-50 text-purple-700 border-purple-200",
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

export function SkillBadge({ level }: { level: SessionSkillLevel }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-medium", sessionSkillConfig[level])}
    >
      {level}
    </Badge>
  );
}

export function PlayerSkillBadge({ level }: { level: PlayerSkillLevel }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-medium", playerSkillConfig[level])}
    >
      {level}
    </Badge>
  );
}
