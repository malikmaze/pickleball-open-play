"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminSessionPage } from "@/components/admin/session-page";
import { CourtsLiveView } from "@/components/courts/courts-live-view";

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
    <>
      {sessionId ? (
        <AdminSessionPage sessionId={sessionId} subtitle="Manage courts">
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
        </AdminSessionPage>
      ) : (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
        </div>
      )}
    </>
  );
}
