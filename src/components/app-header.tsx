import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

interface AppHeaderProps {
  showLogo?: boolean;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export function AppHeader({
  showLogo = true,
  subtitle,
  backHref,
  backLabel = "Back",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-black/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 rounded-full px-2 py-1 text-sm font-medium text-sisclub-green transition-colors hover:bg-sisclub-pink-soft"
          >
            ← {backLabel}
          </Link>
        )}
        {showLogo && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-black/10 shadow-sm">
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
              <h1 className="truncate font-heading text-lg font-bold tracking-tight text-sisclub-green-dark">
                {APP_NAME}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
