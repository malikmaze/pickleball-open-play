"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell } from "@/components/page-shell";
import {
  guestBodyGap,
  guestPageWidth,
  type LayoutSize,
} from "@/lib/layout";
import { cn } from "@/lib/utils";

/** Sticky guest header aligned with page content. */
export function GuestAppHeader({
  subtitle,
  backHref,
  logoHref = "/",
}: {
  subtitle: string;
  backHref?: string;
  logoHref?: string;
}) {
  return (
    <AppHeader
      guest
      subtitle={subtitle}
      backHref={backHref}
      logoHref={logoHref}
      contentClassName={guestPageWidth}
    />
  );
}

/** Shared shell for guest/player pages (schedule, join, live, status). */
export function GuestPage({
  children,
  header,
  size = "default",
  className,
}: {
  children: ReactNode;
  header?: ReactNode;
  size?: LayoutSize;
  className?: string;
}) {
  return (
    <PageShell size={size} className="px-0 sm:px-0 lg:px-0">
      {header}
      <div className={cn(guestPageWidth, guestBodyGap, className)}>{children}</div>
    </PageShell>
  );
}
