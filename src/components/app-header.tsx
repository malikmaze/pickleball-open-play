import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { guestShellHeaderClass } from "@/components/guest/guest-ui";
import { adminSessionHeaderPy, guestHeaderPy } from "@/lib/layout";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  showLogo?: boolean;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  /** Tighter header — session/admin shells */
  compact?: boolean;
  /** Playful guest shell — schedule, join, live */
  guest?: boolean;
  /** When set, the logo links here */
  logoHref?: string;
  className?: string;
  contentClassName?: string;
}

export function AppHeader({
  showLogo = true,
  subtitle,
  backHref,
  backLabel = "Back",
  compact = false,
  guest = false,
  logoHref,
  className,
  contentClassName,
}: AppHeaderProps) {
  const isShell = compact || guest;

  const logoNode = (
    <div
      className={cn(
        "relative h-9 w-9 shrink-0 overflow-hidden shadow-sm sm:h-10 sm:w-10",
        isShell
          ? "rounded-full ring-2 ring-pink-300/50 ring-offset-1 ring-offset-white shadow-md shadow-pink-200/40"
          : "rounded-xl border-2 border-black/10"
      )}
    >
      <Image
        src="/images/logo.png"
        alt=""
        fill
        sizes="40px"
        className="object-cover"
        priority
      />
    </div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 backdrop-blur-md supports-[backdrop-filter]:bg-white/90",
        guest
          ? guestShellHeaderClass
          : "border-b-2 border-black/10 bg-white/90 supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 sm:gap-3",
          guest
            ? cn("pt-[env(safe-area-inset-top,0px)]", guestHeaderPy)
            : compact
              ? cn("pt-[env(safe-area-inset-top,0px)]", adminSessionHeaderPy)
              : "py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]",
          contentClassName
        )}
      >
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-sisclub-green transition-colors hover:bg-sisclub-pink-soft sm:px-3"
            aria-label={backLabel}
          >
            <span aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
        )}
        {showLogo && (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            {logoHref ? (
              <Link
                href={logoHref}
                className={cn(
                  isShell && "transition-transform hover:scale-[1.03] active:scale-95"
                )}
                aria-label="Home"
              >
                {logoNode}
              </Link>
            ) : (
              logoNode
            )}
            <div className="min-w-0">
              <h1
                className={cn(
                  "truncate font-heading text-base font-bold tracking-tight text-sisclub-green-dark sm:text-lg",
                  isShell && "flex items-center gap-1.5"
                )}
              >
                {APP_NAME}
                {isShell && (
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-sisclub-pink"
                    aria-hidden
                  />
                )}
              </h1>
              {subtitle && (
                <p
                  className={cn(
                    "truncate text-[11px] sm:text-xs",
                    isShell
                      ? "font-medium text-sisclub-pink-dark/80"
                      : "text-muted-foreground"
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
