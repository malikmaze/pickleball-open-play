"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { adminSessionHeaderPy, adminSessionWidth } from "@/lib/layout";
import {
  adminShellActionClass,
  adminShellHeaderClass,
  adminShellLogoClass,
} from "@/components/admin/admin-ui";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function AdminSessionChrome({
  sessionId,
  subtitle = "Session management",
  className,
}: {
  sessionId: string;
  subtitle?: string;
  className?: string;
}) {
  const { signOut } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        adminShellHeaderClass,
        className
      )}
    >
      <div
        className={cn(
          adminSessionWidth,
          "pt-[env(safe-area-inset-top,0px)]"
        )}
      >
        <div className={cn("flex items-center gap-4 sm:gap-5", adminSessionHeaderPy)}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/admin"
              className={cn(
                adminShellLogoClass,
                "block transition-transform hover:scale-[1.03] active:scale-95"
              )}
              aria-label="Back to dashboard"
            >
              <Image
                src="/images/logo.png"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </Link>
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 truncate font-heading text-base font-bold tracking-tight text-sisclub-green-dark sm:text-lg">
                {APP_NAME}
                <Sparkles
                  className="h-3.5 w-3.5 shrink-0 text-sisclub-pink"
                  aria-hidden
                />
              </h1>
              <p className="truncate text-[11px] font-medium text-sisclub-pink-dark/80 sm:text-xs">
                {subtitle}
              </p>
            </div>
          </div>

          <nav
            aria-label="Session admin"
            className="flex w-[9.25rem] shrink-0 flex-col gap-0.5 rounded-2xl border border-pink-200/40 bg-white/60 p-1 shadow-sm shadow-pink-100/30 backdrop-blur-sm sm:w-[9.75rem]"
          >
            <Link href="/admin" className={adminShellActionClass}>
              <LayoutDashboard className="h-4 w-4 shrink-0 text-sisclub-green" aria-hidden />
              <span>Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className={adminShellActionClass}
            >
              <LogOut className="h-4 w-4 shrink-0 text-sisclub-pink-dark" aria-hidden />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        <SessionAdminTabs sessionId={sessionId} embedded />
      </div>
    </header>
  );
}
