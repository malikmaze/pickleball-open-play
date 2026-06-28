"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AddPlayerDialog } from "@/components/admin/add-player-dialog";
import { PlayerRoster } from "@/components/admin/player-roster";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
import {
  SessionForm,
  sessionFormToPayload,
  sessionToFormValues,
  type SessionFormValues,
} from "@/components/admin/session-form";
import { PageShell } from "@/components/page-shell";
import { SkillBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEligiblePlayers,
  toQueuePlayer,
} from "@/lib/queue/queue-engine";
import { formatSessionDate } from "@/lib/sessions";
import {
  countAdmittedPlayers,
  getWaitlistedPlayers,
  isAdmittedPlayer,
} from "@/lib/waitlist";
import { createClient } from "@/utils/supabase/client";
import {
  addTestPlayersToSession,
  admitWaitlistedPlayerRecord,
  deletePlayerRecord,
  fetchSessionBundle,
  markPlayerNoShow,
  markPlayerPresent,
  markPlayerSecured,
  markPlayersPresentBulk,
  processWaitlistPromotions,
  updatePlayerRecord,
  updateSessionRecord,
} from "@/utils/supabase/queries";
import type { Player, PlayerSkillLevel, SessionBundle } from "@/types";

function SessionAdminContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SessionFormValues | null>(null);
  const [addingTestPlayers, setAddingTestPlayers] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
      if (data) setSettingsForm(sessionToFormValues(data.session));
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Failed to load session");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const session = bundle?.session;

  const handlePlayerStatus = async (
    playerId: string,
    action: "present" | "secured" | "noshow"
  ) => {
    const supabase = createClient();
    try {
      if (action === "present") await markPlayerPresent(supabase, playerId);
      if (action === "secured") await markPlayerSecured(supabase, playerId);
      if (action === "noshow") await markPlayerNoShow(supabase, playerId, sessionId);
      toast.success("Player updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setRemoveLoading(true);
    const supabase = createClient();
    try {
      await deletePlayerRecord(supabase, playerId);
      const promoted = await processWaitlistPromotions(supabase, sessionId);
      if (promoted > 0) {
        toast.success(
          `Player removed · ${promoted} waitlisted player${promoted === 1 ? "" : "s"} admitted`
        );
      } else {
        toast.success("Player removed");
      }
      setRemoveTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleBulkPresent = async (playerIds: string[]) => {
    setBulkLoading(true);
    const supabase = createClient();
    try {
      const count = await markPlayersPresentBulk(supabase, sessionId, playerIds);
      toast.success(`Checked in ${count} player${count === 1 ? "" : "s"}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk check-in failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAdmitWaitlisted = async (playerId: string) => {
    const supabase = createClient();
    try {
      await admitWaitlistedPlayerRecord(supabase, sessionId, playerId);
      toast.success("Player admitted from waitlist");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Admit failed");
    }
  };

  const handleSkillChange = async (
    playerId: string,
    skillLevel: PlayerSkillLevel
  ) => {
    const supabase = createClient();
    try {
      await updatePlayerRecord(supabase, playerId, { skillLevel });
      toast.success("Skill updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !settingsForm) return;
    setSaving(true);
    const supabase = createClient();
    try {
      await updateSessionRecord(supabase, sessionId, sessionFormToPayload(settingsForm));
      toast.success("Settings saved");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestPlayers = async () => {
    setAddingTestPlayers(true);
    const supabase = createClient();
    try {
      const count = await addTestPlayersToSession(supabase, sessionId);
      if (count === 0) {
        toast.info("All test players are already on this session");
      } else {
        toast.success(`Added ${count} test player${count === 1 ? "" : "s"}`);
      }
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add test players"
      );
    } finally {
      setAddingTestPlayers(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  const queuePlayers = session.players.map((p) => toQueuePlayer(p));
  const eligible = getEligiblePlayers(queuePlayers, {
    paymentRequired: session.paymentRequired,
    allowUnpaidInQueue: session.allowUnpaidInQueue,
    skillMatchingMode: session.skillMatchingMode,
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
            {session.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatSessionDate(session.date)} · {session.startTime} –{" "}
            {session.endTime} · {session.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sessions/${sessionId}/live`}
            className="inline-flex h-9 items-center rounded-full border-2 border-black/10 px-3 text-sm font-medium hover:bg-sisclub-pink-soft"
          >
            Public live
          </Link>
          <Button
            variant="outline"
            onClick={() => load()}
            className="rounded-full border-2 border-black/10"
          >
          <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <SessionAdminTabs sessionId={sessionId} />

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader>
              <CardTitle>Session snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Joined: {countAdmittedPlayers(session.players)} /{" "}
                {session.maxPlayers}
              </p>
              <p>Waitlist: {getWaitlistedPlayers(session.players).length}</p>
              <p>
                Checked in:{" "}
                {session.players.filter((p) => p.status === "Present").length}
              </p>
              <p>In queue: {eligible.length}</p>
              <p>Playing: {session.players.filter((p) => p.status === "Playing").length}</p>
              <p>Courts: {session.courtCount}</p>
              <SkillBadge level={session.skillLevel} />
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {session.paymentRequired ? (
                <>
                  <p className="font-semibold text-sisclub-green-dark">
                    Payment required
                    {session.paymentAmount
                      ? ` · ₱${session.paymentAmount}`
                      : ""}
                  </p>
                  {session.paymentNote && <p className="mt-2">{session.paymentNote}</p>}
                </>
              ) : (
                <p>No payment required for this session.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(tab === "registrations" || tab === "checkin") && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              onClick={() => setAddPlayerOpen(true)}
              className="rounded-full bg-sisclub-green font-semibold hover:bg-sisclub-green-dark"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add walk-in
            </Button>
          </div>
          <PlayerRoster
            players={session.players.filter((p) => isAdmittedPlayer(p.status))}
            mode={tab === "checkin" ? "checkin" : "registrations"}
            session={session}
            onStatus={handlePlayerStatus}
            onRemove={(id) => setRemoveTarget(id)}
            onSkillChange={handleSkillChange}
            onBulkPresent={tab === "checkin" ? handleBulkPresent : undefined}
            bulkLoading={bulkLoading}
          />
          {tab === "registrations" && (
            <WaitlistPanel
              players={getWaitlistedPlayers(session.players)}
              admittedCount={countAdmittedPlayers(session.players)}
              maxPlayers={session.maxPlayers}
              onAdmit={handleAdmitWaitlisted}
              onRemove={(id) => setRemoveTarget(id)}
            />
          )}
        </>
      )}

      {tab === "queue" && (
        <Card className="rounded-3xl border-2 border-black/10">
          <CardHeader>
            <CardTitle>Active queue</CardTitle>
            <CardDescription>
              Fair order: fewest games played, then longest wait. Remove players
              who leave the court.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players in queue.</p>
            ) : (
              eligible.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-sisclub-pink-soft/40 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      #{i + 1} {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.skillLevel} · {p.gamesPlayed} games played
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayerStatusBadge status={p.status} />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => setRemoveTarget(p.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Link href={`/admin/sessions/${sessionId}/courts`}>
              <Button className="mt-2 rounded-full bg-sisclub-green hover:bg-sisclub-green-dark">
                Manage Courts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === "settings" && settingsForm && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTestPlayers}
              disabled={addingTestPlayers}
              className="rounded-full border-2 border-amber-300/60 text-amber-900 hover:bg-amber-50"
            >
              {addingTestPlayers ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Add test players (demo)
            </Button>
          </div>
          <SessionForm
            values={settingsForm}
            onChange={setSettingsForm}
          />
          <Button
            type="submit"
            disabled={saving}
            className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
          >
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </form>
      )}

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        sessionId={sessionId}
        onAdded={() => load(true)}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove player?"
        description="This removes them from the session. Waitlisted players may be auto-admitted if a spot opens."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => removeTarget && handleRemovePlayer(removeTarget)}
        isLoading={removeLoading}
      />
    </>
  );
}

function WaitlistPanel({
  players,
  admittedCount,
  maxPlayers,
  onAdmit,
  onRemove,
}: {
  players: Player[];
  admittedCount: number;
  maxPlayers: number;
  onAdmit: (playerId: string) => void;
  onRemove: (playerId: string) => void;
}) {
  const hasCapacity = admittedCount < maxPlayers;

  return (
    <div className="mt-8 space-y-3">
      <div>
        <h3 className="font-heading text-lg font-bold text-sisclub-green-dark">
          Waitlist
        </h3>
        <p className="text-sm text-muted-foreground">
          First in line is admitted automatically when a spot opens. You can
          also admit manually if there is room.
        </p>
      </div>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one on the waitlist.</p>
      ) : (
        players.map((player, index) => (
          <Card key={player.id} className="rounded-2xl border-2 border-orange-200/80">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div>
                <p className="font-semibold text-sisclub-green-dark">
                  #{index + 1} {player.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.skillLevel} · joined{" "}
                  {new Date(player.joinedAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark"
                  disabled={!hasCapacity}
                  onClick={() => onAdmit(player.id)}
                >
                  Admit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  onClick={() => onRemove(player.id)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function SessionAdminPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  if (!sessionId) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  return (
    <PageShell>
      <AppHeader subtitle="Session management" backHref="/admin" />
      <div className="py-6">
        <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />}>
          <SessionAdminContent sessionId={sessionId} />
        </Suspense>
      </div>
    </PageShell>
  );
}
