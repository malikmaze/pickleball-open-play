import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { layoutContainerClass, type LayoutSize } from "@/lib/layout";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  showLogo?: boolean;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  size?: LayoutSize;
}

export function AppHeader({
  showLogo = true,
  subtitle,
  backHref,
  backLabel = "Back",
  size = "default",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-black/10 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div
        className={cn(
          layoutContainerClass(size),
          "flex items-center gap-2 py-3 sm:gap-3",
          "pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
        )}
      >
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex min-h-10 shrink-0 items-center rounded-full px-2.5 text-sm font-medium text-sisclub-green transition-colors hover:bg-sisclub-pink-soft sm:px-3"
            aria-label={backLabel}
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">&nbsp;{backLabel}</span>
          </Link>
        )}
        {showLogo && (
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
              {subtitle && (
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
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
