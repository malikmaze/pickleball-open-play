"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GuestAppHeader, GuestPage } from "@/components/guest/guest-page";
import { CourtsLiveView } from "@/components/courts/courts-live-view";
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
    <GuestPage
      size="fluid"
      header={
        <GuestAppHeader
          subtitle="Courts"
          backHref="/live"
          logoHref="/dashboard"
        />
      }
    >
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
    </GuestPage>
  );
}
