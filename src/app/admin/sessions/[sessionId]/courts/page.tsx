"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Settings } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export default function AdminCourtsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  return (
    <PageShell>
      <AppHeader subtitle="Manage courts" backHref="/admin" />
      <div className="py-6">
        {sessionId ? (
          <>
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
            <CourtsLiveView
              sessionId={sessionId}
              isAdmin
              header={
                <div>
                  <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
                    Manage Courts
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Assign matches, score games, and run the floor.
                  </p>
                </div>
              }
            />
          </>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        )}
      </div>
    </PageShell>
  );
}
