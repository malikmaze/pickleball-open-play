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

const adminListNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Public", icon: CalendarDays },
  { href: "/live", label: "Live", icon: Radio },
  { label: "Logout", icon: LogOut, action: "logout" },
];

function getAdminSessionNav(sessionId: string): NavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: `/admin/sessions/${sessionId}?tab=checkin`,
      label: "Check-in",
      icon: UserCheck,
    },
    {
      href: `/admin/sessions/${sessionId}?tab=queue`,
      label: "Queue",
      icon: Users,
    },
    {
      href: `/admin/sessions/${sessionId}/courts`,
      label: "Courts",
      icon: Radio,
    },
    {
      href: `/admin/sessions/${sessionId}?tab=settings`,
      label: "Settings",
      icon: Settings,
    },
    { label: "Logout", icon: LogOut, action: "logout" },
  ];
}

function parseSessionId(pathname: string): string | null {
  const match = pathname.match(/\/admin\/sessions\/([^/]+)/);
  return match?.[1] ?? null;
}

export function getNavItems(role: UserRole, pathname = ""): NavItem[] {
  if (role !== "admin") return guestNav;
  const sessionId = parseSessionId(pathname);
  if (sessionId) return getAdminSessionNav(sessionId);
  return adminListNav;
}

export function isNavActive(
  pathname: string,
  href: string,
  label?: string,
  activeTab?: string | null
): boolean {
  if (label === "Dashboard" || label === "Home") {
    if (pathname.startsWith("/admin")) return pathname === "/admin";
    return pathname === "/";
  }
  if (label === "Sessions" || label === "Public") {
    return pathname === "/dashboard" || pathname.startsWith("/session/");
  }
  if (label === "Check-in") {
    return (
      pathname.includes("/admin/sessions/") &&
      !pathname.endsWith("/courts") &&
      activeTab === "checkin"
    );
  }
  if (label === "Queue") {
    return pathname.includes("/admin/sessions/") && activeTab === "queue";
  }
  if (label === "Settings") {
    return pathname.includes("/admin/sessions/") && activeTab === "settings";
  }
  if (label === "Courts" && href.endsWith("/courts")) {
    return pathname.endsWith("/courts");
  }
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function getPublicNavItems(
  role: UserRole,
  pathname = ""
): NavItem[] {
  if (role === "admin") {
    const sessionId = parseSessionId(pathname);
    if (sessionId) {
      return getAdminSessionNav(sessionId).filter(
        (i) => i.label !== "Settings"
      );
    }
    return adminListNav.filter((i) => i.label !== "Logout");
  }
  return [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Sessions", icon: CalendarDays },
    { href: "/live", label: "Live", icon: Radio },
  ];
}
