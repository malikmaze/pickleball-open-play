"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Upload } from "lucide-react";
import { AdminSessionChrome } from "@/components/admin/session-chrome";
import { AdminPartnerPanel } from "@/components/admin/admin-partner-panel";
import { AddPlayerDialog } from "@/components/admin/add-player-dialog";
import { ImportPlayersDialog } from "@/components/admin/import-players-dialog";
import { WalkInQuickAdd } from "@/components/admin/walk-in-quick-add";
import { PlayerRoster } from "@/components/admin/player-roster";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PlayerStatusBadge } from "@/components/player-status-badge";
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
import { formatCourtRentalWindow } from "@/lib/court-schedule";
import { PartnerQueueGroup } from "@/components/live/partner-queue-connector";
import { groupAdjacentQueuePartners } from "@/lib/player-partners";
import { FREE_SESSION_PAYMENT_NOTE } from "@/lib/constants";
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
  markPlayerPaid,
  markPlayerPresent,
  markPlayerUnpaid,
  markPlayersPresentBulk,
  processWaitlistPromotions,
  setPlayerPartnerRecord,
  updatePlayerRecord,
  updateSessionRecord,
} from "@/utils/supabase/queries";
import type { Player, PlayerSkillLevel, ProfileGender, SessionBundle } from "@/types";

function SessionAdminContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SessionFormValues | null>(null);
  const [addingTestPlayers, setAddingTestPlayers] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [partnerSaving, setPartnerSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
      if (data) setSettingsForm(sessionToFormValues(data.session, data.courts));
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Failed to load session");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling admin session data
    void load();
    const interval = setInterval(() => void load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const session = bundle?.session;

  const handlePlayerStatus = async (
    playerId: string,
    action: "present" | "noshow"
  ) => {
    const supabase = createClient();
    try {
      if (action === "present") await markPlayerPresent(supabase, playerId, sessionId);
      if (action === "noshow") await markPlayerNoShow(supabase, playerId, sessionId);
      toast.success(action === "present" ? "Checked in" : "Marked no show");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handlePayment = async (playerId: string, paid: boolean) => {
    const supabase = createClient();
    try {
      if (paid) {
        await markPlayerPaid(supabase, playerId, sessionId);
        toast.success("Marked paid");
      } else {
        await markPlayerUnpaid(supabase, playerId);
        toast.success("Marked unpaid");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    }
  };

  const handleGenderChange = async (
    playerId: string,
    gender: ProfileGender
  ) => {
    const supabase = createClient();
    try {
      await updatePlayerRecord(supabase, playerId, { gender });
      await load(true);
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

  const handlePartnerChange = async (
    playerId: string,
    partnerId: string | null
  ) => {
    setPartnerSaving(true);
    const supabase = createClient();
    try {
      await setPlayerPartnerRecord(supabase, sessionId, playerId, partnerId);
      toast.success(partnerId ? "Partner updated" : "Partner removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Partner update failed");
    } finally {
      setPartnerSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !settingsForm) return;
    setSaving(true);
    const supabase = createClient();
    try {
      const { session: payload, courtSchedules } =
        sessionFormToPayload(settingsForm);
      await updateSessionRecord(
        supabase,
        sessionId,
        payload,
        courtSchedules
      );
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

  const queuePlayers = useMemo(
    () => (session ? session.players.map((p) => toQueuePlayer(p)) : []),
    [session]
  );
  const eligible = useMemo(
    () => getEligiblePlayers(queuePlayers),
    [queuePlayers]
  );

  if (loading || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
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
            Guest live view
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

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader>
              <CardTitle>Session snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Booked: {countAdmittedPlayers(session.players)} /{" "}
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
              {bundle?.courts.map((court) => {
                const window = formatCourtRentalWindow(court, session);
                if (!window) return null;
                return (
                  <p key={court.id} className="text-muted-foreground">
                    Court {court.courtNumber}: {window}
                  </p>
                );
              })}
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
                <p className="rounded-2xl border border-sisclub-green/25 bg-sisclub-green/10 px-3 py-2 font-medium text-sisclub-green-dark">
                  {FREE_SESSION_PAYMENT_NOTE}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(tab === "registrations" || tab === "checkin") && (
        <>
          {tab === "registrations" && (
            <>
              <div className="mb-4 rounded-2xl border border-black/10 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-sisclub-green-dark">Booked</p>
                <p className="mt-1">
                  Players who signed up — booking app, messenger, or the public
                  join page. They are <strong>not</strong> in the queue until
                  checked in. Some may not show even if already paid; use{" "}
                  <strong>Mark paid</strong> when payment is confirmed.
                </p>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => setImportOpen(true)}
                  variant="outline"
                  className="rounded-full border-2 border-black/10"
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Bulk import
                </Button>
                <Button
                  onClick={() => setAddPlayerOpen(true)}
                  className="rounded-full bg-sisclub-green font-semibold hover:bg-sisclub-green-dark"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add booking
                </Button>
              </div>
            </>
          )}

          {tab === "checkin" && (
            <div className="mb-4 space-y-3">
              <div className="rounded-2xl border border-black/10 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-sisclub-green-dark">Check-in</p>
                <p className="mt-1">
                  Like a flight — only <strong>checked-in</strong> players enter
                  the queue. Walk-ins can be added and checked in at once below.
                </p>
              </div>
              <WalkInQuickAdd
                session={session}
                players={session.players.filter((p) =>
                  isAdmittedPlayer(p.status)
                )}
                onAdded={() => load(true)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setAddPlayerOpen(true)}
                  variant="outline"
                  className="rounded-full border-2 border-black/10"
                >
                  Walk-in — more options
                </Button>
              </div>
            </div>
          )}

          <PlayerRoster
            players={session.players.filter((p) => isAdmittedPlayer(p.status))}
            mode={tab === "checkin" ? "checkin" : "booked"}
            onStatus={handlePlayerStatus}
            onPayment={handlePayment}
            onRemove={(id) => setRemoveTarget(id)}
            onSkillChange={handleSkillChange}
            onGenderChange={handleGenderChange}
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
        <div className="space-y-4">
          <AdminPartnerPanel
            players={session.players.filter((p) => isAdmittedPlayer(p.status))}
            onPartnerChange={handlePartnerChange}
            disabled={partnerSaving}
          />
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader>
              <CardTitle>Active queue</CardTitle>
              <CardDescription>
                Fair order by games played and wait time. Linking partners moves
                the earlier player down to wait with their partner; pairs are
                always on the same team when assigned.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eligible.length === 0 ? (
                <p className="text-sm text-muted-foreground">No players in queue.</p>
              ) : (
                groupAdjacentQueuePartners(eligible).map((group) => {
                  const renderRow = (
                    p: (typeof eligible)[number],
                    position: number
                  ) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-sisclub-pink-soft/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">
                          #{position} {p.name}
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
                  );

                  if (group.kind === "pair") {
                    const [first, second] = group.players;
                    return (
                      <PartnerQueueGroup key={`${first.id}-${second.id}`}>
                        {renderRow(first, group.startIndex + 1)}
                        {renderRow(second, group.startIndex + 2)}
                      </PartnerQueueGroup>
                    );
                  }

                  return renderRow(group.player, group.index + 1);
                })
              )}
              <Link href={`/admin/sessions/${sessionId}/courts`}>
                <Button className="mt-2 rounded-full bg-sisclub-green hover:bg-sisclub-green-dark">
                  Manage Courts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
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
        session={session}
        players={session.players}
        mode={tab === "checkin" ? "walkin" : "register"}
        onAdded={() => load(true)}
      />

      <ImportPlayersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        session={session}
        onImported={() => load(true)}
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
    <PageShell size="wide">
      <AdminSessionChrome
        sessionId={sessionId}
        subtitle="Session management"
      />
      <div className="py-4 sm:py-5">
        <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />}>
          <SessionAdminContent sessionId={sessionId} />
        </Suspense>
      </div>
    </PageShell>
  );
}
