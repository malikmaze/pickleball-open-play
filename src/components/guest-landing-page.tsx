import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { guestCardClass } from "@/components/guest/guest-ui";
import { guestPageWidth } from "@/lib/layout";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const highlights = [
  { icon: Sparkles, text: "No account needed" },
  { icon: Users, text: "Join in seconds" },
  { icon: Radio, text: "Live court view" },
] as const;

const actions = [
  {
    href: "/dashboard",
    title: "Browse schedule",
    description: "See today’s open play and join a session.",
    icon: CalendarDays,
    tone: "green" as const,
    cta: "View schedule",
  },
  {
    href: "/live",
    title: "Watch live courts",
    description: "Follow games and the queue while play is on.",
    icon: Radio,
    tone: "pink" as const,
    cta: "Go live",
  },
] as const;

export function GuestLandingPage() {
  return (
    <PageShell className="px-0 sm:px-0 lg:px-0">
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,28rem)] bg-gradient-to-b from-sisclub-pink-soft/80 via-pink-50/40 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-sisclub-green/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 top-32 h-40 w-40 rounded-full bg-sisclub-pink/15 blur-3xl"
        />

        <div
          className={cn(
            guestPageWidth,
            "relative mx-auto flex min-h-[calc(100dvh-4.5rem)] flex-col pb-8 pt-6 sm:min-h-[calc(100dvh-3.5rem)] sm:pb-10 sm:pt-8 md:pb-12"
          )}
        >
          <header className="animate-fade-in-up mb-6 flex items-center justify-center gap-2.5 sm:mb-8">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-pink-300/50 ring-offset-2 ring-offset-white shadow-md shadow-pink-200/40">
              <Image
                src="/images/logo.png"
                alt=""
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sisclub-pink-dark/80">
                SisClub
              </p>
              <p className="font-heading text-sm font-bold text-sisclub-green-dark sm:text-base">
                Open play
              </p>
            </div>
          </header>

          <section className="animate-fade-in-up-delay-1 flex flex-col items-center text-center">
            <div className="relative mb-5 sm:mb-6">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-pink-200/40 via-white to-emerald-100/50 blur-sm"
              />
              <div className="relative h-36 w-36 overflow-hidden rounded-[1.75rem] border-2 border-white/80 shadow-xl shadow-pink-200/50 ring-1 ring-pink-200/60 sm:h-44 sm:w-44 md:h-48 md:w-48">
                <Image
                  src="/images/hero-poster.png"
                  alt="Pickleball open play"
                  fill
                  sizes="(max-width: 640px) 176px, 192px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <h1 className="max-w-md font-heading text-3xl font-bold tracking-tight text-sisclub-green-dark sm:text-4xl">
              {APP_NAME}
            </h1>
            <p className="mt-2 max-w-sm text-base text-sisclub-green-dark/70 sm:mt-3 sm:text-lg">
              {APP_TAGLINE}
            </p>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6">
              {highlights.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/50 bg-white/80 px-3 py-1.5 text-xs font-medium text-sisclub-green-dark/80 shadow-sm shadow-pink-100/30"
                >
                  <Icon className="h-3.5 w-3.5 text-sisclub-pink-dark" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="animate-fade-in-up-delay-2 mt-8 flex flex-1 flex-col gap-3 sm:mt-10 sm:gap-4">
            {actions.map(
              ({ href, title, description, icon: Icon, tone, cta }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    guestCardClass,
                    "group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-pink-100/40 sm:p-5",
                    tone === "green" &&
                      "hover:border-sisclub-green/35 hover:ring-1 hover:ring-sisclub-green/15",
                    tone === "pink" &&
                      "hover:border-sisclub-pink/35 hover:ring-1 hover:ring-sisclub-pink/15"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                      tone === "green"
                        ? "bg-sisclub-green/10 text-sisclub-green"
                        : "bg-sisclub-pink-soft text-sisclub-pink-dark"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-heading text-base font-bold text-sisclub-green-dark sm:text-lg">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-sm text-sisclub-green-dark/65">
                      {description}
                    </span>
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-1 text-xs font-semibold sm:text-sm",
                        tone === "green"
                          ? "text-sisclub-green"
                          : "text-sisclub-pink-dark"
                      )}
                    >
                      {cta}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              )
            )}
          </section>

          <footer className="animate-fade-in-up-delay-3 mt-8 text-center text-xs text-muted-foreground sm:mt-10">
            <p>
              EST 2026 · sisclubph
              <span className="mx-2">·</span>
              <Link
                href="/login"
                className="font-medium underline-offset-2 hover:text-sisclub-green hover:underline"
              >
                Organizer login
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </PageShell>
  );
}
