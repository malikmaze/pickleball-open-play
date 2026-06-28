"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Lock,
  Unlock,
  LogOut,
  Play,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageShell } from "@/components/page-shell";
import { SkillBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessions } from "@/hooks/use-sessions";
import {
  SessionForm,
  emptySessionForm,
  sessionFormToPayload,
  sessionToFormValues,
} from "@/components/admin/session-form";
import { defaultSessionFields, formatSessionDate } from "@/lib/sessions";
import { seedSamplePlaySession } from "@/lib/sample-play";
import { createClient } from "@/utils/supabase/client";
import {
  clearSessionPlayersRecord,
  createSessionRecord,
  deleteSessionRecord,
  toggleSessionClosedRecord,
  updateSessionRecord,
} from "@/utils/supabase/queries";
import type { Session } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { sessions, isLoading, error, refetch } = useSessions("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySessionForm());
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySessionForm());
    setFormOpen(true);
  };

  const openEdit = (session: Session) => {
    setEditingId(session.id);
    setForm(sessionToFormValues(session));
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      const payload = sessionFormToPayload(form);
      if (editingId) {
        await updateSessionRecord(supabase, editingId, payload);
        toast.success("Session updated");
      } else {
        await createSessionRecord(supabase, {
          ...defaultSessionFields(),
          ...payload,
        });
        toast.success("Session created");
      }

      await refetch();
      setFormOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save session"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);

    try {
      const supabase = createClient();
      await deleteSessionRecord(supabase, deleteTarget);
      await refetch();
      toast.success("Session deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete session"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearPlayers = async () => {
    if (!clearTarget) return;
    setActionLoading(true);

    try {
      const supabase = createClient();
      await clearSessionPlayersRecord(supabase, clearTarget);
      await refetch();
      toast.success("Players cleared");
      setClearTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to clear players"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleClosed = async (session: Session) => {
    try {
      const supabase = createClient();
      const nextStatus = await toggleSessionClosedRecord(
        supabase,
        session.id,
        session.status
      );
      await refetch();
      toast.success(
        nextStatus === "closed" ? "Session closed" : "Session reopened"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update session"
      );
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSamplePlay = async () => {
    setSampleLoading(true);
    try {
      const supabase = createClient();
      const sessionId = await seedSamplePlaySession(supabase);
      await refetch();
      toast.success("Sample play created!");
      router.push(`/admin/sessions/${sessionId}/courts`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create sample play"
      );
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <PageShell>
      <AppHeader subtitle="Admin dashboard" backHref="/" />

      <div className="py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
              Manage Sessions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All scheduled open play sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSamplePlay}
              disabled={sampleLoading}
              className="rounded-full border-2 border-sisclub-pink/40 text-sisclub-pink-dark hover:bg-sisclub-pink-soft"
            >
              {sampleLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Sample play
            </Button>
            <Button
              onClick={openCreate}
              className="rounded-full border-2 border-black/10 bg-sisclub-green font-semibold text-white shadow-sm hover:bg-sisclub-green-dark"
            >
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-full border-2 border-black/10"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm font-semibold text-sisclub-green underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-black/10 bg-white/60">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sessions yet.</p>
              <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={handleSamplePlay}
                  disabled={sampleLoading}
                  variant="outline"
                  className="rounded-full border-2 border-sisclub-pink/40 text-sisclub-pink-dark hover:bg-sisclub-pink-soft"
                >
                  {sampleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Load sample play
                </Button>
                <Button
                  onClick={openCreate}
                  className="rounded-full bg-sisclub-green font-semibold hover:bg-sisclub-green-dark"
                >
                  Create first session
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="rounded-3xl border-2 border-black/10 shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-heading text-lg text-sisclub-green-dark">
                        {session.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatSessionDate(session.date)} · {session.startTime}{" "}
                        – {session.endTime} · {session.courtNumber}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      <StatusBadge status={session.status} />
                      <SkillBadge level={session.skillLevel} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {session.players.length} / {session.maxPlayers} players
                    {session.players.length > 0 &&
                      ` · ${session.players.map((p) => p.name).join(", ")}`}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/sessions/${session.id}/courts`}
                      className="inline-flex h-7 items-center rounded-full bg-sisclub-pink px-3 text-xs font-medium text-white hover:bg-sisclub-pink-dark"
                    >
                      Live Court View
                    </Link>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="inline-flex h-7 items-center rounded-full bg-sisclub-green px-3 text-xs font-medium text-white hover:bg-sisclub-green-dark"
                    >
                      Manage
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(session)}
                      className="rounded-full border-2 border-black/10"
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleClosed(session)}
                      className="rounded-full border-2 border-black/10"
                    >
                      {session.status === "closed" ? (
                        <>
                          <Unlock className="mr-1 h-3.5 w-3.5" />
                          Reopen
                        </>
                      ) : (
                        <>
                          <Lock className="mr-1 h-3.5 w-3.5" />
                          Close
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setClearTarget(session.id)}
                      disabled={session.players.length === 0}
                      className="rounded-full border-2 border-black/10"
                    >
                      <Users className="mr-1 h-3.5 w-3.5" />
                      Clear players
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(session.id)}
                      className="rounded-full"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-black/10 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sisclub-green-dark">
              {editingId ? "Edit Session" : "Create Session"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <SessionForm values={form} onChange={setForm} />
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-full bg-sisclub-green font-bold hover:bg-sisclub-green-dark"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                "Update Session"
              ) : (
                "Create Session"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete session?"
        description="This will permanently remove the session and all player sign-ups. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={!!clearTarget}
        onOpenChange={(open) => !open && setClearTarget(null)}
        title="Clear all players?"
        description="This will remove every player from this session and reopen it for sign-ups."
        confirmLabel="Clear players"
        onConfirm={handleClearPlayers}
        isLoading={actionLoading}
      />
    </PageShell>
  );
}
