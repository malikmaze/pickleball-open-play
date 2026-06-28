import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Radio } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function GuestLandingPage() {
  return (
    <PageShell className="flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center sm:py-12">
        <div className="animate-fade-in-up mb-6 sm:mb-8">
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-3xl border-2 border-black/10 shadow-lg sm:h-48 sm:w-48 md:h-56 md:w-56">
            <Image
              src="/images/hero-poster.png"
              alt="Pickleball Open Play"
              fill
              sizes="(max-width: 640px) 192px, 224px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="animate-fade-in-up-delay-1 mb-2 flex items-center justify-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              src="/images/logo.png"
              alt="SisClub"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium tracking-widest text-sisclub-green uppercase">
            SisClub
          </span>
        </div>

        <h1 className="animate-fade-in-up-delay-1 font-heading text-3xl font-bold tracking-tight text-sisclub-green-dark sm:text-4xl md:text-5xl">
          {APP_NAME}
        </h1>

        <p className="animate-fade-in-up-delay-2 mt-3 max-w-md text-base text-muted-foreground sm:mt-4 sm:text-lg">
          {APP_TAGLINE}
        </p>

        <div className="animate-fade-in-up-delay-3 mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-xs">
          <Link
            href="/dashboard"
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black/10 bg-sisclub-green text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-sisclub-green-dark hover:shadow-lg"
          >
            Join Open Play
          </Link>
          <Link
            href="/live"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-sisclub-pink/30 bg-sisclub-pink-soft text-sm font-semibold text-sisclub-pink-dark transition-all hover:bg-sisclub-pink/20"
          >
            <Radio className="h-4 w-4" />
            Watch live courts
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-black/10 text-sm font-semibold text-sisclub-green-dark transition-all hover:bg-sisclub-green/5"
          >
            <CalendarDays className="h-4 w-4" />
            View schedule
          </Link>
        </div>

        <p className="animate-fade-in-up-delay-3 mt-12 text-xs text-muted-foreground">
          EST 2026 · sisclubph
          <span className="mx-2">·</span>
          <Link
            href="/login"
            className="underline-offset-2 hover:text-sisclub-green hover:underline"
          >
            Admin
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
