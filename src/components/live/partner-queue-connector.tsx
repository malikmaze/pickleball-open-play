"use client";

import { cn } from "@/lib/utils";

/** Vertical link between two adjacent partner rows in the queue. */
export function PartnerQueueConnector() {
  return (
    <div
      className="relative flex w-5 shrink-0 flex-col items-center self-stretch py-2"
      aria-hidden
    >
      <div className="w-0.5 min-h-3 flex-1 rounded-full bg-gradient-to-b from-pink-100 via-pink-300 to-rose-400" />
      <div className="z-10 my-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-pink-200/90 bg-gradient-to-br from-pink-50 to-rose-50 text-[9px] text-rose-500 shadow-sm">
        ♡
      </div>
      <div className="w-0.5 min-h-3 flex-1 rounded-full bg-gradient-to-b from-rose-400 via-pink-300 to-pink-100" />
    </div>
  );
}

export function PartnerQueueGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <PartnerQueueConnector />
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}
