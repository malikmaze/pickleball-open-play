import { cn } from "@/lib/utils";

export function CourtSessionStats({
  stats,
  className,
  flush = false,
}: {
  stats: { label: string; value: string; highlight?: boolean }[];
  className?: string;
  /** Sit flush inside a parent card (no outer border/radius). */
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        !flush &&
          "overflow-hidden rounded-2xl border-2 border-sisclub-green-dark/15 shadow-md",
        className
      )}
    >
      <div className="grid grid-cols-2 gap-px bg-white/20 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-h-[4rem] flex-col items-center justify-center gap-0.5 bg-sisclub-green-dark px-3 py-3 text-center text-white"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/65">
              {stat.label}
            </span>
            <span
              className={cn(
                "text-sm font-semibold leading-none sm:text-base",
                stat.highlight && "text-emerald-300"
              )}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
