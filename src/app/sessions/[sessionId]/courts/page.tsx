"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Settings } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-is-admin";

function CourtsPageContent({ sessionId }: { sessionId: string }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  return (
    <CourtsLiveView
      sessionId={sessionId}
      isAdmin={isAdmin}
      header={
        <div>
          <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
            {isAdmin ? "Manage Courts" : "Live Courts"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Assign matches, score games, and run the floor."
              : "Watch live scores and queue updates."}
          </p>
        </div>
      }
    />
  );
}

export default function PublicCourtsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  return (
    <PageShell>
      <AppHeader
        subtitle="Live court view"
        backHref={isAdmin && !adminLoading ? "/admin" : "/dashboard"}
      />
      <div className="py-6">
        {sessionId ? (
          <>
            {isAdmin && !adminLoading && (
              <div className="mb-4 space-y-4">
                <SessionAdminTabs sessionId={sessionId} />
                <div className="flex justify-end">
                  <Link href={`/admin/sessions/${sessionId}`}>
                    <Button variant="outline" className="rounded-full">
                      <Settings className="mr-1 h-4 w-4" />
                      Session admin
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            <Suspense
              fallback={
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
              }
            >
              <CourtsPageContent sessionId={sessionId} />
            </Suspense>
          </>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        )}
      </div>
    </PageShell>
  );
}
