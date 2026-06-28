"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems, isNavActive } from "@/lib/nav-items";
import { useAuth } from "@/hooks/use-auth";

export function DesktopNav() {
  const pathname = usePathname();
  const { role, loading, signOut } = useAuth();
  const items = getNavItems(loading ? "guest" : role);

  return (
    <nav className="hidden border-b-2 border-black/10 bg-white/90 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-1 px-4 py-2">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.action === "logout") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-sisclub-pink-soft hover:text-sisclub-green-dark"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          }

          const href = item.href!;
          const active = isNavActive(pathname, href, item.label);

          return (
            <Link
              key={href + item.label}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-sisclub-green text-white shadow-sm"
                  : "text-muted-foreground hover:bg-sisclub-pink-soft hover:text-sisclub-green-dark"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
