"use client";

import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { cn } from "@/lib/utils";

export function AdminSessionChrome({
  sessionId,
  subtitle,
  backHref = "/admin",
  backLabel = "Back",
  className,
}: {
  sessionId: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 border-b-2 border-black/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85",
        className
      )}
    >
      <div className="pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-2.5 py-3 sm:gap-3">
          <Link
            href={backHref}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-sisclub-green transition-colors hover:bg-sisclub-pink-soft sm:px-3"
          >
            <span aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border-2 border-black/10 shadow-sm sm:h-10 sm:w-10">
              <Image
                src="/images/logo.png"
                alt="SisClub logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-base font-bold tracking-tight text-sisclub-green-dark sm:text-lg">
                {APP_NAME}
              </h1>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <SessionAdminTabs sessionId={sessionId} embedded />
      </div>
    </div>
  );
}
