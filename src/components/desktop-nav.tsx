"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { layoutContainerClass } from "@/lib/layout";
import { getNavItems, isNavActive } from "@/lib/nav-items";
import { useAuth } from "@/hooks/use-auth";

export function DesktopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const { role, loading, signOut } = useAuth();

  // Session chrome includes Dashboard + Logout on admin session routes.
  if (pathname.startsWith("/admin")) return null;

  const items = getNavItems(loading ? "guest" : role);

  const links = items.filter((item) => item.action !== "logout");
  const logout = items.find((item) => item.action === "logout");

  return (
    <nav className="hidden border-b-2 border-black/10 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 md:block">
      <div
        className={cn(
          layoutContainerClass("full"),
          "flex items-center gap-3 py-2",
          role === "admin" && !loading ? "justify-between" : "justify-center"
        )}
      >
        <div className="flex flex-wrap items-center gap-1">
          {links.map((item) => {
            const Icon = item.icon;
            const href = item.href!;
            const active = isNavActive(pathname, href, item.label, activeTab);

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

        {logout && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-sisclub-pink-soft hover:text-sisclub-green-dark"
          >
            <logout.icon className="h-4 w-4" />
            {logout.label}
          </button>
        )}
      </div>
    </nav>
  );
}
