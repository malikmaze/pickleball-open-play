import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function LandingPage() {
  return (
    <PageShell className="flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-12 text-center">
        <div className="animate-fade-in-up mb-8">
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-3xl border-2 border-black/10 shadow-lg sm:h-56 sm:w-56">
            <Image
              src="/images/hero-poster.png"
              alt="Pickleball Open Play"
              fill
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
              className="object-cover"
            />
          </div>
          <span className="text-sm font-medium tracking-widest text-sisclub-green uppercase">
            SisClub
          </span>
        </div>

        <h1 className="animate-fade-in-up-delay-1 font-heading text-4xl font-bold tracking-tight text-sisclub-green-dark sm:text-5xl">
          {APP_NAME}
        </h1>

        <p className="animate-fade-in-up-delay-2 mt-4 max-w-sm text-lg text-muted-foreground">
          {APP_TAGLINE}
        </p>

        <div className="animate-fade-in-up-delay-3 mt-10 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black/10 bg-sisclub-green text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-sisclub-green-dark hover:shadow-lg"
          >
            Join Open Play
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-black/10 bg-background font-semibold transition-all hover:bg-sisclub-pink-soft"
          >
            Organizer Admin
          </Link>
        </div>

        <p className="animate-fade-in-up-delay-3 mt-12 text-xs text-muted-foreground">
          EST 2026 · sisclubph
        </p>
      </div>
    </PageShell>
  );
}
