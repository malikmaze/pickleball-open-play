"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Sessions", icon: CalendarDays },
  { href: "/login", label: "Admin", icon: Shield },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden border-b-2 border-black/10 bg-white/90 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-1 px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : href === "/login" ? pathname.startsWith("/login") || pathname.startsWith("/admin") : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-sisclub-green text-white shadow-sm"
                  : "text-muted-foreground hover:bg-sisclub-pink-soft hover:text-sisclub-green-dark"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
