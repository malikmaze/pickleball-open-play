import { FREE_SESSION_PAYMENT_NOTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SessionPaymentFields = {
  paymentRequired: boolean;
  paymentAmount?: number | string | null;
  paymentNote?: string | null;
  paymentInstructions?: string | null;
};

export function SessionPaymentBanner({
  session,
  className,
  compact,
  joinForm,
}: {
  session: SessionPaymentFields;
  className?: string;
  compact?: boolean;
  joinForm?: boolean;
}) {
  if (session.paymentRequired) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-amber-200 bg-amber-50 text-amber-900",
          compact ? "px-3 py-2 text-sm" : "p-3 text-sm",
          className
        )}
      >
        <p className="font-semibold">
          {joinForm ? "Payment required for this session" : "Payment required"}
        </p>
        {session.paymentAmount != null && session.paymentAmount !== "" && (
          <p className={compact ? "mt-0.5" : "mt-1"}>
            Amount: ₱{session.paymentAmount}
          </p>
        )}
        {session.paymentNote && <p>{session.paymentNote}</p>}
        {session.paymentInstructions && (
          <p className={compact ? "mt-0.5 text-xs" : "mt-1"}>
            {session.paymentInstructions}
          </p>
        )}
        {joinForm && (
          <p className="mt-2 text-xs">
            The admin will mark you as Secured after payment is confirmed.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 overflow-hidden rounded-2xl border-2 border-pink-200/80 bg-gradient-to-r from-pink-50 via-sisclub-pink-soft to-violet-50 text-sisclub-pink-dark shadow-[0_2px_12px_rgba(255,133,162,0.2)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.9),transparent_50%)]",
        compact ? "px-3 py-2 text-sm" : "p-3.5 text-sm",
        className
      )}
    >
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pink-200/80 bg-white/90 text-lg shadow-sm"
        aria-hidden
      >
        💖
      </span>
      <p className="relative pt-1 font-heading font-bold leading-snug text-sisclub-pink-dark">
        {FREE_SESSION_PAYMENT_NOTE}
        <span aria-hidden className="ml-1.5 text-xs">✨♡</span>
      </p>
    </div>
  );
}
