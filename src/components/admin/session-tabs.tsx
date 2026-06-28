"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "registrations", label: "Joined" },
  { id: "checkin", label: "Check-in" },
  { id: "queue", label: "Queue" },
  { id: "courts", label: "Courts", href: (id: string) => `/admin/sessions/${id}/courts` },
  { id: "settings", label: "Settings" },
] as const;

export function SessionAdminTabs({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const isCourtsPage =
    pathname.includes("/admin/sessions/") && pathname.endsWith("/courts");

  return (
    <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 snap-x snap-mandatory sm:snap-none">
      {tabs.map((tab) => {
        const href =
          "href" in tab && tab.href
            ? tab.href(sessionId)
            : `/admin/sessions/${sessionId}?tab=${tab.id}`;
        const isActive =
          tab.id === "courts"
            ? isCourtsPage
            : !isCourtsPage && activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "shrink-0 snap-start rounded-full px-3 py-2 text-sm font-medium transition-all sm:px-4",
              isActive
                ? "bg-sisclub-green text-white shadow-sm"
                : "bg-white text-muted-foreground hover:bg-sisclub-pink-soft"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
