"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
import { PageShell } from "@/components/page-shell";

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
    <PageShell size="wide">
      <AppHeader subtitle="Manage courts" backHref="/admin" size="wide" />
      <div className="py-4 sm:py-6">
        {sessionId ? (
          <>
            <SessionAdminTabs sessionId={sessionId} />
            <CourtsLiveView
              sessionId={sessionId}
              isAdmin
              header={
                <div>
                  <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
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
