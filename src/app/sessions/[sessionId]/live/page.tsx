"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
import { PageShell } from "@/components/page-shell";

function LiveSessionContent({ sessionId }: { sessionId: string }) {
  return (
    <CourtsLiveView
      sessionId={sessionId}
      isAdmin={false}
      showQueue={false}
      showSidePanels
    />
  );
}

export default function LiveSessionPage({
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
      <AppHeader subtitle="Live" backHref="/live" />
      <div className="py-6">
        {sessionId ? (
          <Suspense
            fallback={
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
            }
          >
            <LiveSessionContent sessionId={sessionId} />
          </Suspense>
        ) : (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />
        )}
      </div>
    </PageShell>
  );
}
