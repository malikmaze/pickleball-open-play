"use client";

import Link from "next/link";
import {
  AdminCallout,
} from "@/components/admin/admin-ui";
import { AdminPartnerPanel } from "@/components/admin/admin-partner-panel";
import { QueueNextUpCard } from "@/components/admin/queue-next-up-card";
import { QueuePanel } from "@/components/live/queue-panel";
import { getQueueSessionSettings } from "@/lib/sessions";
import {
  previewNextMatch,
  type QueuePlayer,
} from "@/lib/queue/queue-engine";
import type { Player, Session } from "@/types";

export function AdminQueueTab({
  session,
  sessionId,
  eligible,
  partnerPlayers,
  onPartnerChange,
  partnerSaving,
  onRemovePlayer,
  onBulkRemovePlayers,
  bulkRemoveLoading,
}: {
  session: Session;
  eligible: QueuePlayer[];
  sessionId: string;
  partnerPlayers: Player[];
  onPartnerChange: (playerId: string, partnerId: string | null) => void;
  partnerSaving: boolean;
  onRemovePlayer: (playerId: string) => void;
  onBulkRemovePlayers?: (playerIds: string[]) => void;
  bulkRemoveLoading?: boolean;
}) {
  const queueSettings = getQueueSessionSettings(session);
  const nextMatch = previewNextMatch(eligible, queueSettings);
  const nextUpIds = new Set(nextMatch?.players.map((p) => p.id) ?? []);

  return (
    <div className="space-y-4">
      <AdminCallout title="Running the queue">
        Order is fair by games played and wait time. Link partners below — they
        wait together and always share a team. Use <strong>Manage courts</strong>{" "}
        to assign the next match.
      </AdminCallout>

      <QueueNextUpCard
        queueCount={eligible.length}
        nextMatch={nextMatch}
        courtsHref={`/admin/sessions/${sessionId}/courts`}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,22rem)] xl:items-stretch">
        <QueuePanel
          players={eligible}
          onRemovePlayer={onRemovePlayer}
          onBulkRemovePlayers={onBulkRemovePlayers}
          bulkRemoveLoading={bulkRemoveLoading}
          nextUpPlayerIds={nextUpIds}
          fillHeight
          emptyAction={
            <Link
              href={`/admin/sessions/${sessionId}?tab=checkin`}
              className="font-medium text-sisclub-green underline-offset-2 hover:underline"
            >
              Go to Check-in
            </Link>
          }
        />

        <AdminPartnerPanel
          players={partnerPlayers}
          onPartnerChange={onPartnerChange}
          disabled={partnerSaving}
          compact
          fillHeight
        />
      </div>
    </div>
  );
}
