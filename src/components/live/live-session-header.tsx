"use client";

import type { Session } from "@/types";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function LiveSessionHeader({ session }: { session: Session }) {
  const checkedIn = session.players.filter((p) =>
    ["Present", "Waiting", "Playing", "Secured"].includes(p.status)
  ).length;
  const queueSize = session.players.filter((p) =>
    ["Present", "Waiting"].includes(p.status)
  ).length;

  const stats = [
    { label: "Location", value: session.location },
    { label: "Date", value: new Date(session.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) },
    { label: "Time", value: `${formatTime(session.startTime)} – ${formatTime(session.endTime)}` },
    { label: "Courts", value: String(session.courtCount) },
    { label: "Checked in", value: `${checkedIn} / ${session.maxPlayers}` },
    { label: "Queue", value: String(queueSize) },
    { label: "Game to", value: String(session.targetScore) },
    { label: "Win by", value: String(session.winBy) },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl md:text-3xl">
          {session.title}
        </h1>
        <p className="text-sm text-muted-foreground">Live open play</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border-2 border-sisclub-green-dark/15 bg-sisclub-green-dark px-3 py-2 text-white shadow-sm"
          >
            <span className="text-[10px] uppercase tracking-wide text-white/60">
              {stat.label}
            </span>
            <p className="truncate text-sm font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
