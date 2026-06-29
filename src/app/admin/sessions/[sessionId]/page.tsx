"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEligiblePlayers,
  toQueuePlayer,
} from "@/lib/queue/queue-engine";
import { formatCourtRentalWindow } from "@/lib/court-schedule";
import { FREE_SESSION_PAYMENT_NOTE } from "@/lib/constants";
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
      toast.success(`Skill updated to ${skillLevel}`);
      await load();
    } catch (err) {
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
          onRemovePlayer={(id) => setRemoveTarget(id)}
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
    <AdminSection
      title="Waitlist"
      description="First in line is admitted when a spot opens. You can also admit manually if there is room."
      className="mt-6"
    >
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one on the waitlist.</p>
      ) : (
        <div className="divide-y divide-black/5 rounded-2xl border border-black/5">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
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
