import type { ActivityEventType, ActivityLog } from "@/types";

export const ACTIVITY_ICONS: Record<ActivityEventType, string> = {
  match_finished: "🏆",
  match_started: "🎾",
  now_calling: "📢",
  check_in: "👋",
  payment_confirmed: "💳",
  side_change: "🔄",
  court_cleared: "🧹",
};

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatExactTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function activityPreview(log: ActivityLog): string {
  return `${ACTIVITY_ICONS[log.eventType]} ${log.title}`;
}
