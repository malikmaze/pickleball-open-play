"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "registrations", label: "Booked" },
  { id: "checkin", label: "Check-in" },
  { id: "queue", label: "Queue" },
  {
    id: "courts",
    label: "Courts",
    href: (id: string) => `/admin/sessions/${id}/courts`,
  },
  { id: "settings", label: "Settings" },
] as const;

export function SessionAdminTabs({
  sessionId,
  embedded = false,
  className,
}: {
  sessionId: string;
  /** Renders inside AdminSessionChrome without extra sticky shell. */
  embedded?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const isCourtsPage =
    pathname.includes("/admin/sessions/") && pathname.endsWith("/courts");

  return (
    <nav
      aria-label="Session sections"
      className={cn(
        embedded
          ? "border-t border-black/10 pb-3 pt-3"
          : cn(
              "sticky z-30 mb-6 border-b border-black/10 bg-white/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/85",
              "top-[calc(3.5rem+env(safe-area-inset-top,0px))]"
            ),
        className
      )}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:snap-none">
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
                "inline-flex h-9 shrink-0 snap-start items-center rounded-full px-3.5 text-sm font-medium transition-all sm:px-4",
                isActive
                  ? "bg-sisclub-green text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-sisclub-pink-soft hover:text-sisclub-green-dark"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
