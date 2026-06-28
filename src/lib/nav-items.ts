import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  action?: "logout";
}

/** Guests (players): browse, join open play, watch live — no login. */
const guestNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Sessions", icon: CalendarDays },
  { href: "/live", label: "Live", icon: Radio },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Sessions", icon: CalendarDays },
  { href: "/admin", label: "Queue", icon: Users },
  { href: "/admin", label: "Check-in", icon: UserCheck },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/admin", label: "Settings", icon: Settings },
  { label: "Logout", icon: LogOut, action: "logout" },
];

export function getNavItems(role: UserRole): NavItem[] {
  if (role === "admin") return adminNav;
  return guestNav;
}

export function isNavActive(
  pathname: string,
  href: string,
  label?: string
): boolean {
  if (label === "Dashboard" || label === "Home") {
    return pathname === "/";
  }
  if (label === "Sessions") {
    return pathname === "/dashboard" || pathname.startsWith("/session/");
  }
  if (href === "/admin") return pathname.startsWith("/admin");
  return pathname.startsWith(href);
}

export function getPublicNavItems(role: UserRole): NavItem[] {
  if (role === "admin") {
    return adminNav.filter((i) => !["Queue", "Check-in"].includes(i.label));
  }
  return [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Sessions", icon: CalendarDays },
    { href: "/live", label: "Live", icon: Radio },
  ];
}
