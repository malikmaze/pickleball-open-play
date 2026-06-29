"use client";

import { AdminSessionChrome } from "@/components/admin/session-chrome";
import { PageShell } from "@/components/page-shell";
import { adminSessionBodyGap, adminSessionWidth } from "@/lib/layout";
import { cn } from "@/lib/utils";

/** Shared shell for every session admin tab (Overview … Courts … Settings). */
export function AdminSessionPage({
  sessionId,
  subtitle = "Session management",
  children,
  className,
}: {
  sessionId: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageShell size="fluid" className="px-0 sm:px-0 lg:px-0">
      <AdminSessionChrome sessionId={sessionId} subtitle={subtitle} />
      <div className={cn(adminSessionWidth, adminSessionBodyGap, className)}>
        {children}
      </div>
    </PageShell>
  );
}
