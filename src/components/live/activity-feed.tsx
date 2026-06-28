"use client";

import type { ActivityLog } from "@/types";
import {
  ACTIVITY_ICONS,
  formatExactTime,
  formatRelativeTime,
} from "@/lib/activity-log";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader>
          <CardTitle className="text-base">Live Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-2 border-black/10">
      <CardHeader>
        <CardTitle className="text-base">Live Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="max-h-96 space-y-3 overflow-y-auto">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg leading-none">
                  {ACTIVITY_ICONS[log.eventType]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sisclub-green-dark">
                    {log.title}
                  </p>
                  {log.description && (
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {log.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span title={formatExactTime(log.createdAt)}>
                  {formatRelativeTime(log.createdAt)}
                </span>
                <span className="mx-1">·</span>
                <span>{formatExactTime(log.createdAt)}</span>
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
