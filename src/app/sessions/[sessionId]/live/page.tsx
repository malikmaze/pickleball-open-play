"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
import { PageShell } from "@/components/page-shell";
import { getJoinedPlayerId } from "@/hooks/use-player-profile";

function LiveSessionContent({ sessionId }: { sessionId: string }) {
  const highlightPlayerId = getJoinedPlayerId(sessionId);

  return (
    <CourtsLiveView
      sessionId={sessionId}
      isAdmin={false}
      showQueue={false}
      showSidePanels
      highlightPlayerId={highlightPlayerId}
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
    <PageShell size="wide">
      <AppHeader subtitle="Live" backHref="/live" />
      <div className="py-4 sm:py-6">
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
