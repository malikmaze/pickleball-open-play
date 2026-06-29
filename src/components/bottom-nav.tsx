"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPublicNavItems, isNavActive } from "@/lib/nav-items";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const router = useRouter();
  const { role, loading, signOut } = useAuth();
  const items = getPublicNavItems(loading ? "guest" : role, pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-pink-200/50 bg-white/95 shadow-[0_-4px_20px_rgba(255,133,162,0.12)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.action === "logout") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => signOut()}
                className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground transition-all hover:text-sisclub-green/70 min-h-11 justify-center"
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          }

          const href = item.href!;
          const active = isNavActive(pathname, href, item.label, activeTab);

          return (
            <Link
              key={href + item.label}
              href={href}
              onClick={(e) => {
                if (href === pathname) {
                  e.preventDefault();
                  router.refresh();
                }
              }}
              className={cn(
                "flex min-h-11 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-all sm:text-xs",
                active
                  ? "text-sisclub-green"
                  : "text-muted-foreground hover:text-sisclub-green/70"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="h-1 w-1 rounded-full bg-sisclub-pink" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
