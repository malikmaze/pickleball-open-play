"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Loader2, Radio } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSessionDate } from "@/lib/sessions";
import { useSessions } from "@/hooks/use-sessions";

function LivePicker() {
  const { sessions, isLoading, error, refetch } = useSessions();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm font-semibold text-sisclub-green underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card
          key={session.id}
          className="rounded-3xl border-2 border-black/10 shadow-sm transition-all hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg text-sisclub-green-dark">
              {session.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatSessionDate(session.date)} · {session.location} ·{" "}
              {session.courtCount} courts
            </p>
          </CardHeader>
          <CardContent>
            <Link href={`/sessions/${session.id}/live`}>
              <Button className="w-full rounded-full bg-sisclub-green font-semibold text-white sm:w-auto">
                <Radio className="mr-2 h-4 w-4" />
                Watch live
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LivePage() {
  return (
    <PageShell>
      <AppHeader subtitle="Live open play" backHref="/dashboard" />
      <div className="py-6">
        <h2 className="mb-4 font-heading text-2xl font-bold text-sisclub-green-dark">
          Today&apos;s Live Sessions
        </h2>
        <Suspense
          fallback={
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
          }
        >
          <LivePicker />
        </Suspense>
      </div>
    </PageShell>
  );
}
