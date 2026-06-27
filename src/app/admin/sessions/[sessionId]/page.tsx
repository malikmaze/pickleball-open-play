"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { SessionAdminTabs } from "@/components/admin/session-tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYER_SKILL_LEVELS, SESSION_SKILL_LEVELS } from "@/lib/constants";
import {
  getEligiblePlayers,
  toQueuePlayer,
} from "@/lib/queue/queue-engine";
import { createClient } from "@/utils/supabase/client";
import {
  deletePlayerRecord,
  fetchSessionBundle,
  markPlayerNoShow,
  markPlayerPresent,
  markPlayerSecured,
  updatePlayerRecord,
  updateSessionRecord,
} from "@/utils/supabase/queries";
import type { Player, PlayerSkillLevel, Session, SessionBundle } from "@/types";
import { Suspense } from "react";

function SessionAdminContent({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchSessionBundle(supabase, sessionId);
      setBundle(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const data = await fetchSessionBundle(supabase, sessionId);
        if (!cancelled) setBundle(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load session");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const session = bundle?.session;

  const handlePlayerStatus = async (
    playerId: string,
    action: "present" | "secured" | "noshow"
  ) => {
    const supabase = createClient();
    try {
      if (action === "present") await markPlayerPresent(supabase, playerId);
      if (action === "secured") await markPlayerSecured(supabase, playerId);
      if (action === "noshow") await markPlayerNoShow(supabase, playerId);
      toast.success("Player updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    const supabase = createClient();
    try {
      await deletePlayerRecord(supabase, playerId);
      toast.success("Player removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
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

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    try {
      await updateSessionRecord(supabase, sessionId, {
        courtCount: Number(form.get("courtCount")),
        targetScore: Number(form.get("targetScore")),
        winBy: Number(form.get("winBy")),
        paymentRequired: form.get("paymentRequired") === "on",
        paymentAmount: form.get("paymentAmount")
          ? Number(form.get("paymentAmount"))
          : undefined,
        paymentNote: String(form.get("paymentNote") || ""),
        paymentInstructions: String(form.get("paymentInstructions") || ""),
        allowUnpaidInQueue: form.get("allowUnpaidInQueue") === "on",
        autoAssignNextMatch: form.get("autoAssignNextMatch") === "on",
        maxPlayers: Number(form.get("maxPlayers")),
        skillLevel: String(form.get("skillLevel")) as Session["skillLevel"],
      });
      toast.success("Settings saved");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
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
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
            {session.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {session.startTime} – {session.endTime} · {session.location}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => load()}
          className="rounded-full border-2 border-black/10"
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <SessionAdminTabs sessionId={sessionId} />

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-3xl border-2 border-black/10">
            <CardHeader>
              <CardTitle>Session snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Registered: {session.players.length}</p>
              <p>Present: {session.players.filter((p) => p.status === "Present" || p.status === "Waiting").length}</p>
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
        <PlayerList
          players={session.players}
          mode={tab}
          session={session}
          onStatus={handlePlayerStatus}
          onRemove={handleRemovePlayer}
          onSkillChange={handleSkillChange}
        />
      )}

      {tab === "queue" && (
        <Card className="rounded-3xl border-2 border-black/10">
          <CardHeader>
            <CardTitle>Active queue</CardTitle>
            <CardDescription>
              Fair order: fewest games played, then longest wait
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players in queue.</p>
            ) : (
              eligible.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-sisclub-pink-soft/40 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      #{i + 1} {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.skillLevel} · {p.gamesPlayed} games played
                    </p>
                  </div>
                  <PlayerStatusBadge status={p.status} />
                </div>
              ))
            )}
            <Link href={`/admin/courts/${sessionId}`}>
              <Button className="mt-2 rounded-full bg-sisclub-green hover:bg-sisclub-green-dark">
                Open courts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === "settings" && (
        <Card className="rounded-3xl border-2 border-black/10">
          <CardHeader>
            <CardTitle>Session settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Courts</Label>
                  <Input name="courtCount" type="number" min={1} max={12} defaultValue={session.courtCount} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>Target score</Label>
                  <Input name="targetScore" type="number" min={1} defaultValue={session.targetScore} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>Win by</Label>
                  <Input name="winBy" type="number" min={1} defaultValue={session.winBy} className="rounded-2xl" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max players</Label>
                  <Input name="maxPlayers" type="number" min={4} defaultValue={session.maxPlayers} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label>Session skill</Label>
                  <select
                    name="skillLevel"
                    defaultValue={session.skillLevel}
                    className="h-10 w-full rounded-2xl border-2 border-black/10 px-3 text-sm"
                  >
                    {SESSION_SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment amount</Label>
                <Input name="paymentAmount" type="number" step="0.01" defaultValue={session.paymentAmount ?? ""} className="rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label>Payment note</Label>
                <Input name="paymentNote" defaultValue={session.paymentNote ?? ""} className="rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label>Payment instructions</Label>
                <Input name="paymentInstructions" defaultValue={session.paymentInstructions ?? ""} className="rounded-2xl" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="paymentRequired" defaultChecked={session.paymentRequired} />
                Payment required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allowUnpaidInQueue" defaultChecked={session.allowUnpaidInQueue} />
                Allow unpaid players in queue
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="autoAssignNextMatch" defaultChecked={session.autoAssignNextMatch} />
                Auto assign next match
              </label>
              <Button type="submit" disabled={saving} className="rounded-full bg-sisclub-green hover:bg-sisclub-green-dark">
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function PlayerList({
  players,
  mode,
  session,
  onStatus,
  onRemove,
  onSkillChange,
}: {
  players: Player[];
  mode: string;
  session: Session;
  onStatus: (id: string, action: "present" | "secured" | "noshow") => void;
  onRemove: (id: string) => void;
  onSkillChange: (id: string, skill: PlayerSkillLevel) => void;
}) {
  return (
    <div className="space-y-3">
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No registrations yet.</p>
      ) : (
        players.map((player) => {
          const waitLabel = player.checkedInAt
            ? `checked in ${new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : `registered ${new Date(player.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

          return (
            <Card key={player.id} className="rounded-2xl border-2 border-black/10">
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sisclub-green-dark">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.contactNumber || "No contact"} · {player.gamesPlayed} games · {waitLabel}
                    </p>
                    {player.note && (
                      <p className="mt-1 text-xs italic text-muted-foreground">{player.note}</p>
                    )}
                  </div>
                  <PlayerStatusBadge status={player.status} />
                </div>
                {mode === "checkin" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus(player.id, "present")}>
                      Present
                    </Button>
                    {session.paymentRequired && (
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus(player.id, "secured")}>
                        Secured
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => onStatus(player.id, "noshow")}>
                      No Show
                    </Button>
                    <Select
                      value={player.skillLevel}
                      onValueChange={(v) => onSkillChange(player.id, v as PlayerSkillLevel)}
                    >
                      <SelectTrigger className="h-8 w-40 rounded-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAYER_SKILL_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="destructive" className="rounded-full" onClick={() => onRemove(player.id)}>
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
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
