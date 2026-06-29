"use client";

/** Explains the partner connector shown between linked queue rows. */
export function PartnerQueueLegend() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-pink-100/90 bg-gradient-to-r from-pink-50/80 to-rose-50/40 px-3 py-2.5">
      <div
        className="flex w-4 shrink-0 flex-col items-center self-stretch py-0.5"
        aria-hidden
      >
        <div className="min-h-2 w-0.5 flex-1 rounded-full bg-gradient-to-b from-pink-200 to-rose-400" />
        <span className="my-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-pink-200/90 bg-white text-[8px] text-rose-500 shadow-sm">
          ♡
        </span>
        <div className="min-h-2 w-0.5 flex-1 rounded-full bg-gradient-to-b from-rose-400 to-pink-200" />
      </div>
      <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-pink-900">Linked partners</p>
        <p className="mt-0.5">
          The pink line connects players who are booked as partners. They wait
          together in the queue and always play on the same team when called to
          a court.
        </p>
      </div>
    </div>
  );
}
