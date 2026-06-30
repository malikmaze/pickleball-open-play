"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Upload } from "lucide-react";
import { AdminSessionPage } from "@/components/admin/session-page";
import { AdminSessionHeader } from "@/components/admin/admin-session-header";
import {
  AdminCallout,
  AdminSection,
  adminBtnOutline,
  adminBtnPrimary,
  adminCardClass,
} from "@/components/admin/admin-ui";
import { AdminQueueTab } from "@/components/admin/admin-queue-tab";
import { AddPlayerDialog } from "@/components/admin/add-player-dialog";
import { ImportPlayersDialog } from "@/components/admin/import-players-dialog";
import { WalkInQuickAdd } from "@/components/admin/walk-in-quick-add";
import { BulkSelectBar } from "@/components/admin/bulk-select-bar";
import { PlayerRoster } from "@/components/admin/player-roster";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  SessionForm,
  sessionFormToPayload,
  sessionToFormValues,
  type SessionFormValues,
} from "@/components/admin/session-form";
import { SkillBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEligiblePlayers,
  toQueuePlayer,
} from "@/lib/queue/queue-engine";
import { formatCourtRentalWindow } from "@/lib/court-schedule";
import { FREE_SESSION_PAYMENT_NOTE } from "@/lib/constants";
import {
  bulkRemoveDialogCopy,
  type PlayerRemoveContext,
  resolvePlayerRemove,
  summarizeBulkRemove,
} from "@/lib/player-remove";
import { cn } from "@/lib/utils";
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
  uncheckPlayerFromQueueRecord,
  updatePlayerRecord,
  updateSessionRecord,
} from "@/utils/supabase/queries";
import type { Player, PlayerSkillLevel, ProfileGender, SessionBundle } from "@/types";

function patchPlayerInBundle(
  bundle: SessionBundle,
  playerId: string,
  patch: Partial<Player>
): SessionBundle {
  return {
    ...bundle,
    session: {
      ...bundle.session,
      players: bundle.session.players.map((player) =>
        player.id === playerId ? { ...player, ...patch } : player
      ),
    },
  };
}

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
  const [removeRequest, setRemoveRequest] = useState<
    | { kind: "single"; playerId: string; context: PlayerRemoveContext }
    | { kind: "bulk"; playerIds: string[]; context: PlayerRemoveContext }
    | null
  >(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [partnerSaving, setPartnerSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
      if (data && !(silent && tab === "settings")) {
        setSettingsForm(sessionToFormValues(data.session, data.courts));
      }
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Failed to load session");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling admin session data
    void load();
    if (tab === "settings") return;
    const interval = setInterval(() => void load(true), 15000);
    return () => clearInterval(interval);
  }, [load, tab]);

  const session = bundle?.session;

  const removePlan = useMemo(() => {
    if (!removeRequest || !session) return null;
    if (removeRequest.kind === "single") {
      const player = session.players.find((p) => p.id === removeRequest.playerId);
      if (!player) return null;
      const plan = resolvePlayerRemove(player, removeRequest.context);
      return "blockedReason" in plan ? null : plan;
    }
    const players = removeRequest.playerIds
      .map((id) => session.players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const summary = summarizeBulkRemove(players, removeRequest.context);
    if (summary.entries.length === 0) return null;
    return bulkRemoveDialogCopy(summary, removeRequest.context);
  }, [removeRequest, session]);

  const openRemove = (playerId: string, context: PlayerRemoveContext) => {
    const player = session?.players.find((p) => p.id === playerId);
    if (!player) return;
    const plan = resolvePlayerRemove(player, context);
    if ("blockedReason" in plan) {
      toast.error(plan.blockedReason);
      return;
    }
    setRemoveRequest({ kind: "single", playerId, context });
  };

  const openBulkRemove = (playerIds: string[], context: PlayerRemoveContext) => {
    if (playerIds.length === 0 || !session) return;
    const players = playerIds
      .map((id) => session.players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const summary = summarizeBulkRemove(players, context);
    if (summary.entries.length === 0) {
      toast.error(summary.blocked[0]?.reason ?? "No players can be removed");
      return;
    }
    setRemoveRequest({
      kind: "bulk",
      playerIds: summary.entries.map((e) => e.playerId),
      context,
    });
  };

  const handlePlayerStatus = async (
    playerId: string,
    action: "present" | "noshow"
  ) => {
    const supabase = createClient();
    try {
      if (action === "present") await markPlayerPresent(supabase, playerId, sessionId);
      if (action === "noshow") await markPlayerNoShow(supabase, playerId, sessionId);
      toast.success(action === "present" ? "Checked in" : "Marked no show");
      await load(true);
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
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    }
  };

  const handleGenderChange = async (
    playerId: string,
    gender: ProfileGender
  ) => {
    const previous = bundle?.session.players.find((p) => p.id === playerId)?.gender;
    setBundle((prev) =>
      prev ? patchPlayerInBundle(prev, playerId, { gender }) : prev
    );

    const supabase = createClient();
    try {
      await updatePlayerRecord(supabase, playerId, { gender });
      await load(true);
    } catch (err) {
      if (previous !== undefined) {
        setBundle((prev) =>
          prev ? patchPlayerInBundle(prev, playerId, { gender: previous }) : prev
        );
      } else {
        await load(true);
      }
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeRequest || !session) return;

    setRemoveLoading(true);
    const supabase = createClient();
    try {
      if (removeRequest.kind === "single") {
        const player = session.players.find((p) => p.id === removeRequest.playerId);
        if (!player) return;
        const plan = resolvePlayerRemove(player, removeRequest.context);
        if ("blockedReason" in plan) return;

        if (plan.action === "uncheck") {
          await uncheckPlayerFromQueueRecord(supabase, removeRequest.playerId);
          toast.success(
            removeRequest.context === "queue"
              ? `${player.name} moved back to check-in`
              : `${player.name} moved back to booked list`
          );
        } else {
          await deletePlayerRecord(supabase, removeRequest.playerId);
          const promoted = await processWaitlistPromotions(supabase, sessionId);
          if (promoted > 0) {
            toast.success(
              `${player.name} removed · ${promoted} waitlisted player${promoted === 1 ? "" : "s"} admitted`
            );
          } else {
            toast.success(`${player.name} removed from session`);
          }
        }
      } else {
        const players = removeRequest.playerIds
          .map((id) => session.players.find((p) => p.id === id))
          .filter((p): p is Player => !!p);
        const summary = summarizeBulkRemove(players, removeRequest.context);

        for (const entry of summary.entries) {
          if (entry.action === "uncheck") {
            await uncheckPlayerFromQueueRecord(supabase, entry.playerId);
          } else {
            await deletePlayerRecord(supabase, entry.playerId);
          }
        }

        let promoted = 0;
        if (summary.deleteCount > 0) {
          promoted = await processWaitlistPromotions(supabase, sessionId);
        }

        const n = summary.entries.length;
        const parts: string[] = [`${n} player${n === 1 ? "" : "s"} updated`];
        if (summary.uncheckCount > 0) {
          parts.push(
            `${summary.uncheckCount} moved to ${
              removeRequest.context === "queue" ? "check-in" : "booked list"
            }`
          );
        }
        if (summary.deleteCount > 0) {
          parts.push(`${summary.deleteCount} removed`);
        }
        if (promoted > 0) {
          parts.push(
            `${promoted} waitlisted admitted`
          );
        }
        toast.success(parts.join(" · "));
      }

      setRemoveRequest(null);
      await load(true);
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
      await load(true);
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
    const previous = bundle?.session.players.find((p) => p.id === playerId)
      ?.skillLevel;
    setBundle((prev) =>
      prev ? patchPlayerInBundle(prev, playerId, { skillLevel }) : prev
    );

    const supabase = createClient();
    try {
      await updatePlayerRecord(supabase, playerId, { skillLevel });
      toast.success(`Skill updated to ${skillLevel}`);
      await load(true);
    } catch (err) {
      if (previous) {
        setBundle((prev) =>
          prev
            ? patchPlayerInBundle(prev, playerId, { skillLevel: previous })
            : prev
        );
      } else {
        await load(true);
      }
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(
        message.includes("skill_level") || message.includes("check constraint")
          ? `${message} — run migration 012_player_skill_newbie.sql in Supabase if Newbie was just added.`
          : message
      );
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
      await load(true);
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

  if ((loading && !bundle) || !session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      </div>
    );
  }

  return (
    <>
      {tab === "overview" && (
        <>
          <AdminSessionHeader
            session={session}
            sessionId={sessionId}
            onRefresh={() => load()}
            loading={loading}
            showStats
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className={adminCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {session.paymentRequired ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-sisclub-green-dark">
                      Payment required
                      {session.paymentAmount
                        ? ` · ₱${session.paymentAmount}`
                        : ""}
                    </p>
                    {session.paymentNote && <p>{session.paymentNote}</p>}
                    {session.paymentInstructions && (
                      <p className="text-muted-foreground">
                        {session.paymentInstructions}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-sisclub-green/25 bg-sisclub-green/10 px-3 py-2 font-medium text-sisclub-green-dark">
                    {FREE_SESSION_PAYMENT_NOTE}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={adminCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Match rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Game to <strong>{session.targetScore}</strong> · Win by{" "}
                  <strong>{session.winBy}</strong>
                </p>
                <p>
                  Skill matching:{" "}
                  <strong>{session.skillMatchingMode}</strong>
                </p>
                <p>
                  Auto assign:{" "}
                  <strong>
                    {session.autoAssignNextMatch ? "On" : "Off"}
                  </strong>
                </p>
                <SkillBadge level={session.skillLevel} />
              </CardContent>
            </Card>

            {bundle && bundle.courts.length > 0 && (
              <Card className={cn(adminCardClass, "md:col-span-2 xl:col-span-1")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Court rentals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {bundle.courts.map((court) => {
                    const window = formatCourtRentalWindow(court, session);
                    return (
                      <p key={court.id} className="flex justify-between gap-3">
                        <span className="font-medium text-sisclub-green-dark">
                          Court {court.courtNumber}
                        </span>
                        <span className="text-muted-foreground">
                          {window ?? "—"}
                        </span>
                      </p>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {(tab === "registrations" || tab === "checkin") && (
        <div className="space-y-4">
          {tab === "registrations" && (
            <>
              <AdminCallout title="Booked players">
                Players who signed up are <strong>not</strong> in the queue until
                checked in. Use <strong>Mark paid</strong> when payment is
                confirmed.
              </AdminCallout>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setImportOpen(true)}
                  variant="outline"
                  className={adminBtnOutline}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Bulk import
                </Button>
                <Button onClick={() => setAddPlayerOpen(true)} className={adminBtnPrimary}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add booking
                </Button>
              </div>
            </>
          )}

          {tab === "checkin" && (
            <div className="space-y-4">
              <AdminCallout title="Check-in" tone="success">
                Only <strong>checked-in</strong> players enter the queue. Walk-ins
                can be added and checked in at once below.
              </AdminCallout>
              <WalkInQuickAdd
                session={session}
                players={session.players.filter((p) =>
                  isAdmittedPlayer(p.status)
                )}
                onAdded={() => load(true)}
              />
              <Button
                onClick={() => setAddPlayerOpen(true)}
                variant="outline"
                className={adminBtnOutline}
              >
                Walk-in — more options
              </Button>
            </div>
          )}

          <PlayerRoster
            key={tab}
            players={session.players.filter((p) => isAdmittedPlayer(p.status))}
            mode={tab === "checkin" ? "checkin" : "booked"}
            removeContext={tab === "checkin" ? "checkin" : "booked"}
            onStatus={handlePlayerStatus}
            onPayment={handlePayment}
            onRemove={(id) =>
              openRemove(id, tab === "checkin" ? "checkin" : "booked")
            }
            onBulkRemove={(ids) =>
              openBulkRemove(ids, tab === "checkin" ? "checkin" : "booked")
            }
            onSkillChange={handleSkillChange}
            onGenderChange={handleGenderChange}
            onBulkPresent={tab === "checkin" ? handleBulkPresent : undefined}
            bulkLoading={bulkLoading || removeLoading}
          />
          {tab === "registrations" && (
            <WaitlistPanel
              players={getWaitlistedPlayers(session.players)}
              admittedCount={countAdmittedPlayers(session.players)}
              maxPlayers={session.maxPlayers}
              onAdmit={handleAdmitWaitlisted}
              onRemove={(id) => openRemove(id, "waitlist")}
              onBulkRemove={(ids) => openBulkRemove(ids, "waitlist")}
              bulkRemoveLoading={removeLoading}
            />
          )}
        </div>
      )}

      {tab === "queue" && (
        <AdminQueueTab
          session={session}
          sessionId={sessionId}
          eligible={eligible}
          partnerPlayers={session.players.filter((p) => isAdmittedPlayer(p.status))}
          onPartnerChange={handlePartnerChange}
          partnerSaving={partnerSaving}
          onRemovePlayer={(id) => openRemove(id, "queue")}
          onBulkRemovePlayers={(ids) => openBulkRemove(ids, "queue")}
          bulkRemoveLoading={removeLoading}
        />
      )}

      {tab === "settings" && settingsForm && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <AdminCallout title="Session settings" tone="warning">
            Changes apply to this session immediately after you save. Court count
            and rental times affect live assignment.
          </AdminCallout>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTestPlayers}
            disabled={addingTestPlayers}
            className={cn(
              adminBtnOutline,
              "border-amber-300/60 text-amber-900 hover:bg-amber-50"
            )}
          >
            {addingTestPlayers ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : null}
            Add test players (demo)
          </Button>
          <SessionForm values={settingsForm} onChange={setSettingsForm} />
          <Button type="submit" disabled={saving} className={adminBtnPrimary}>
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
        open={!!removeRequest && !!removePlan}
        onOpenChange={(open) => !open && setRemoveRequest(null)}
        title={removePlan?.title ?? "Remove player?"}
        description={removePlan?.description ?? ""}
        confirmLabel={removePlan?.confirmLabel ?? "Remove"}
        variant={removePlan?.destructive ? "destructive" : "default"}
        onConfirm={handleConfirmRemove}
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
  onBulkRemove,
  bulkRemoveLoading,
}: {
  players: Player[];
  admittedCount: number;
  maxPlayers: number;
  onAdmit: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  onBulkRemove?: (playerIds: string[]) => void;
  bulkRemoveLoading?: boolean;
}) {
  const hasCapacity = admittedCount < maxPlayers;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectableIds = players.map((p) => p.id);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(selectableIds) : new Set());
  };

  return (
    <AdminSection
      title="Waitlist"
      description="First in line is admitted when a spot opens. You can also admit manually if there is room."
      className="mt-6"
    >
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one on the waitlist.</p>
      ) : (
        <>
          {onBulkRemove && (
            <BulkSelectBar
              selectedCount={selected.size}
              totalSelectable={selectableIds.length}
              onSelectAll={handleSelectAll}
              onClear={() => setSelected(new Set())}
              onRemove={() => onBulkRemove([...selected])}
              removeLoading={bulkRemoveLoading}
            />
          )}
          <div className="divide-y divide-black/5 rounded-2xl border border-black/5">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                {onBulkRemove && (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-sisclub-green"
                    checked={selected.has(player.id)}
                    onChange={() => toggleSelected(player.id)}
                  />
                )}
                <div className="min-w-0">
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
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className={adminBtnPrimary}
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
            </div>
          ))}
          </div>
        </>
      )}
    </AdminSection>
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
    <AdminSessionPage sessionId={sessionId} subtitle="Session management">
      <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin text-sisclub-green" />}>
        <SessionAdminContent sessionId={sessionId} />
      </Suspense>
    </AdminSessionPage>
  );
}
