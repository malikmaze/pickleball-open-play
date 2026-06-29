"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminSessionChrome } from "@/components/admin/session-chrome";
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
      {sessionId ? (
        <>
          <AdminSessionChrome
            sessionId={sessionId}
            subtitle="Manage courts"
          />
          <div className="py-4 sm:py-5">
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
          </div>
        </>
      ) : (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
        </div>
      )}
    </PageShell>
  );
}
