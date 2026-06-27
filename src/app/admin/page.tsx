"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Users,
  Lock,
  Unlock,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/use-app-data";
import { useMounted } from "@/hooks/use-mounted";
import { SKILL_LEVELS } from "@/lib/constants";
import {
  clearSessionPlayers,
  createSession,
  deleteSession,
  getTodaySessions,
  toggleSessionClosed,
  updateSession,
} from "@/lib/storage";
import type { Session, SkillLevel } from "@/types";

interface SessionFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  courtNumber: string;
  skillLevel: SkillLevel;
  maxPlayers: number;
}

const emptyForm = (): SessionFormData => ({
  title: "",
  date: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  endTime: "10:00",
  location: "SisClub Courts",
  courtNumber: "Court 1",
  skillLevel: "Mixed",
  maxPlayers: 8,
});

export default function AdminPage() {
  const mounted = useMounted();
  const { data, isLoading, updateData } = useAppData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionFormData>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [clearTarget, setClearTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sessions = data ? getTodaySessions(data.sessions) : [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (session: Session) => {
    setEditingId(session.id);
    setForm({
      title: session.title,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      courtNumber: session.courtNumber,
      skillLevel: session.skillLevel,
      maxPlayers: session.maxPlayers,
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);

    if (editingId) {
      updateData((prev) =>
        updateSession(prev, editingId, {
          title: form.title.trim(),
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location.trim(),
          courtNumber: form.courtNumber.trim(),
          skillLevel: form.skillLevel,
          maxPlayers: form.maxPlayers,
        })
      );
      toast.success("Session updated");
    } else {
      updateData((prev) =>
        createSession(prev, {
          title: form.title.trim(),
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location.trim(),
          courtNumber: form.courtNumber.trim(),
          skillLevel: form.skillLevel,
          maxPlayers: form.maxPlayers,
        })
      );
      toast.success("Session created");
    }

    setIsSaving(false);
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    updateData((prev) => deleteSession(prev, deleteTarget));
    toast.success("Session deleted");
    setDeleteTarget(null);
    setActionLoading(false);
  };

  const handleClearPlayers = () => {
    if (!clearTarget) return;
    setActionLoading(true);
    updateData((prev) => clearSessionPlayers(prev, clearTarget));
    toast.success("Players cleared");
    setClearTarget(null);
    setActionLoading(false);
  };

  const handleToggleClosed = (sessionId: string) => {
    const wasClosed =
      data?.sessions.find((s) => s.id === sessionId)?.status === "closed";
    updateData((prev) => toggleSessionClosed(prev, sessionId));
    toast.success(wasClosed ? "Session reopened" : "Session closed");
  };

  return (
    <PageShell>
      <AppHeader subtitle="Organizer tools" backHref="/" />

      <div className="py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-sisclub-green-dark">
              Manage Sessions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage today&apos;s open play
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-full border-2 border-black/10 bg-sisclub-green font-semibold text-white shadow-sm hover:bg-sisclub-green-dark"
          >
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </div>

        {!mounted || isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-black/10 bg-white/60">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sessions yet.</p>
              <Button
                onClick={openCreate}
                className="mt-4 rounded-full bg-sisclub-green font-semibold hover:bg-sisclub-green-dark"
              >
                Create first session
              </Button>
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
                        {session.startTime} – {session.endTime} ·{" "}
                        {session.courtNumber}
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
                      onClick={() => handleToggleClosed(session.id)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-black/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-sisclub-green-dark">
              {editingId ? "Edit Session" : "Create Session"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Morning Open Play"
                className="rounded-2xl border-2 border-black/10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={2}
                  max={32}
                  value={form.maxPlayers}
                  onChange={(e) =>
                    setForm({ ...form, maxPlayers: Number(e.target.value) })
                  }
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-2xl border-2 border-black/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="court">Court</Label>
              <Input
                id="court"
                value={form.courtNumber}
                onChange={(e) =>
                  setForm({ ...form, courtNumber: e.target.value })
                }
                className="rounded-2xl border-2 border-black/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Skill level</Label>
              <Select
                value={form.skillLevel}
                onValueChange={(v) =>
                  setForm({ ...form, skillLevel: v as SkillLevel })
                }
              >
                <SelectTrigger className="w-full rounded-2xl border-2 border-black/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
