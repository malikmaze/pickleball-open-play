"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  adminShellTabClass,
  adminShellTabTrayClass,
} from "@/components/admin/admin-ui";
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
          ? "border-t border-pink-200/40 py-2.5 sm:py-3"
          : cn(
              "sticky z-30 mb-6 border-b border-pink-200/40 bg-white/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/85",
              "top-[calc(3.5rem+env(safe-area-inset-top,0px))]"
            ),
        className
      )}
    >
      <div className={adminShellTabTrayClass}>
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
              className={adminShellTabClass(isActive)}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
