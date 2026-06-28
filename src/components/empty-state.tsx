import { CalendarOff } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No sessions today",
  description = "Check back later or ask an organizer to add open play sessions.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-white/60 px-4 py-12 text-center shadow-sm sm:px-6 sm:py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sisclub-pink-soft">
        <CalendarOff className="h-8 w-8 text-sisclub-pink" />
      </div>
      <h3 className="font-heading text-lg font-bold text-sisclub-green-dark">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
