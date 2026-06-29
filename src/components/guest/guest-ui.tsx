"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared card shell for guest surfaces. */
export const guestCardClass =
  "rounded-3xl border-2 border-pink-200/40 bg-white shadow-sm shadow-pink-100/25";

export const guestCardJoinedClass =
  "rounded-3xl border-2 border-sisclub-green/30 bg-gradient-to-br from-white via-pink-50/30 to-emerald-50/40 shadow-md shadow-sisclub-green/10 ring-1 ring-sisclub-green/15";

export const guestBtnPrimary =
  "rounded-full bg-sisclub-green font-semibold text-white shadow-md shadow-sisclub-green/20 hover:bg-sisclub-green-dark";

export const guestBtnOutline =
  "rounded-full border-2 border-pink-200/60 bg-white/90 font-semibold text-sisclub-green-dark shadow-sm shadow-pink-100/30 hover:border-pink-300/70 hover:bg-sisclub-pink-soft";

export const guestBtnPink =
  "rounded-full border-2 border-sisclub-pink/35 bg-sisclub-pink-soft font-semibold text-sisclub-pink-dark shadow-sm hover:bg-sisclub-pink/15";

export const guestShellHeaderClass =
  "border-b border-pink-200/50 bg-gradient-to-b from-sisclub-pink-soft/90 via-white to-white shadow-sm shadow-pink-100/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/90";

export const guestShellLogoClass =
  "relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-pink-300/50 ring-offset-1 ring-offset-white shadow-md shadow-pink-200/40 transition-transform hover:scale-[1.03] active:scale-95 sm:h-10 sm:w-10";

export function GuestPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 sm:mb-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-sisclub-green-dark/70">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        )}
      </div>
    </div>
  );
}
