"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SESSION_SKILL_LEVELS, SKILL_MATCHING_MODES } from "@/lib/constants";
import type { SessionSkillLevel, SkillMatchingMode } from "@/types";

export interface SessionFormValues {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  courtNumber: string;
  skillLevel: SessionSkillLevel;
  maxPlayers: number;
  courtCount: number;
  targetScore: number;
  winBy: number;
  paymentRequired: boolean;
  paymentAmount: string;
  paymentNote: string;
  paymentInstructions: string;
  allowUnpaidInQueue: boolean;
  autoAssignNextMatch: boolean;
  allowSideChange: boolean;
  sideChangePoint: number;
  skillMatchingMode: SkillMatchingMode;
}

export function emptySessionForm(): SessionFormValues {
  return {
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "10:00",
    location: "SisClub Courts",
    courtNumber: "Court 1",
    skillLevel: "Mixed",
    maxPlayers: 8,
    courtCount: 1,
    targetScore: 15,
    winBy: 2,
    paymentRequired: false,
    paymentAmount: "",
    paymentNote: "",
    paymentInstructions: "",
    allowUnpaidInQueue: true,
    autoAssignNextMatch: false,
    allowSideChange: true,
    sideChangePoint: 8,
    skillMatchingMode: "Balanced",
  };
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-black/5 bg-white/60 px-3 py-2 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-sisclub-green"
      />
      {label}
    </label>
  );
}

export function SessionForm({
  values,
  onChange,
  showBasics = true,
}: {
  values: SessionFormValues;
  onChange: (values: SessionFormValues) => void;
  showBasics?: boolean;
}) {
  const set = <K extends keyof SessionFormValues>(
    key: K,
    value: SessionFormValues[K]
  ) => onChange({ ...values, [key]: value });

  return (
    <div className="space-y-4">
      {showBasics && (
        <Card className="rounded-3xl border-2 border-black/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Details</CardTitle>
            <CardDescription>Session title, schedule, and capacity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
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
                  value={values.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={4}
                  max={64}
                  value={values.maxPlayers}
                  onChange={(e) => set("maxPlayers", Number(e.target.value))}
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
                  value={values.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={values.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className="rounded-2xl border-2 border-black/10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                className="rounded-2xl border-2 border-black/10"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="court">Court label</Label>
                <Input
                  id="court"
                  value={values.courtNumber}
                  onChange={(e) => set("courtNumber", e.target.value)}
                  className="rounded-2xl border-2 border-black/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Session skill</Label>
                <Select
                  value={values.skillLevel}
                  onValueChange={(v) => set("skillLevel", v as SessionSkillLevel)}
                >
                  <SelectTrigger className="rounded-2xl border-2 border-black/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_SKILL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Settings</CardTitle>
          <CardDescription>Registration payment rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckboxField
            id="paymentRequired"
            label="Require payment"
            checked={values.paymentRequired}
            onChange={(v) => set("paymentRequired", v)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment amount</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={values.paymentAmount}
                onChange={(e) => set("paymentAmount", e.target.value)}
                placeholder="0.00"
                className="rounded-2xl border-2 border-black/10"
                disabled={!values.paymentRequired}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment note</Label>
              <Input
                value={values.paymentNote}
                onChange={(e) => set("paymentNote", e.target.value)}
                placeholder="e.g. GCash"
                className="rounded-2xl border-2 border-black/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment instructions</Label>
            <textarea
              value={values.paymentInstructions}
              onChange={(e) => set("paymentInstructions", e.target.value)}
              rows={2}
              className="w-full rounded-2xl border-2 border-black/10 bg-transparent px-3 py-2 text-sm"
              placeholder="Send payment to…"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Match Rules</CardTitle>
          <CardDescription>Scoring and side-change behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Target score</Label>
              <Input
                type="number"
                min={1}
                value={values.targetScore}
                onChange={(e) => set("targetScore", Number(e.target.value))}
                className="rounded-2xl border-2 border-black/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Win by</Label>
              <Input
                type="number"
                min={1}
                value={values.winBy}
                onChange={(e) => set("winBy", Number(e.target.value))}
                className="rounded-2xl border-2 border-black/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Side change at</Label>
              <Input
                type="number"
                min={1}
                value={values.sideChangePoint}
                onChange={(e) => set("sideChangePoint", Number(e.target.value))}
                className="rounded-2xl border-2 border-black/10"
                disabled={!values.allowSideChange}
              />
            </div>
          </div>
          <CheckboxField
            id="allowSideChange"
            label="Allow side change"
            checked={values.allowSideChange}
            onChange={(v) => set("allowSideChange", v)}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Court Settings</CardTitle>
          <CardDescription>How many courts run for this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Number of courts</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={values.courtCount}
              onChange={(e) => set("courtCount", Number(e.target.value))}
              className="rounded-2xl border-2 border-black/10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-black/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Queue Settings</CardTitle>
          <CardDescription>Player matching and auto-assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Skill matching mode</Label>
            <Select
              value={values.skillMatchingMode}
              onValueChange={(v) =>
                set("skillMatchingMode", v as SkillMatchingMode)
              }
            >
              <SelectTrigger className="rounded-2xl border-2 border-black/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_MATCHING_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Strict keeps skill levels tight. Balanced is recommended. Flexible
              fills courts faster.
            </p>
          </div>
          <CheckboxField
            id="allowUnpaidInQueue"
            label="Allow unpaid players in queue"
            checked={values.allowUnpaidInQueue}
            onChange={(v) => set("allowUnpaidInQueue", v)}
          />
          <CheckboxField
            id="autoAssignNextMatch"
            label="Auto assign next match"
            checked={values.autoAssignNextMatch}
            onChange={(v) => set("autoAssignNextMatch", v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function sessionFormToPayload(values: SessionFormValues) {
  return {
    title: values.title.trim(),
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    location: values.location.trim(),
    courtNumber: values.courtNumber.trim(),
    skillLevel: values.skillLevel,
    maxPlayers: values.maxPlayers,
    courtCount: values.courtCount,
    targetScore: values.targetScore,
    winBy: values.winBy,
    paymentRequired: values.paymentRequired,
    paymentAmount: values.paymentAmount
      ? Number(values.paymentAmount)
      : undefined,
    paymentNote: values.paymentNote.trim() || undefined,
    paymentInstructions: values.paymentInstructions.trim() || undefined,
    allowUnpaidInQueue: values.allowUnpaidInQueue,
    autoAssignNextMatch: values.autoAssignNextMatch,
    allowSideChange: values.allowSideChange,
    sideChangePoint: values.sideChangePoint,
    skillMatchingMode: values.skillMatchingMode,
  };
}

export function sessionToFormValues(session: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  courtNumber: string;
  skillLevel: SessionSkillLevel;
  maxPlayers: number;
  courtCount: number;
  targetScore: number;
  winBy: number;
  paymentRequired: boolean;
  paymentAmount?: number;
  paymentNote?: string;
  paymentInstructions?: string;
  allowUnpaidInQueue: boolean;
  autoAssignNextMatch: boolean;
  allowSideChange: boolean;
  sideChangePoint: number;
  skillMatchingMode: SkillMatchingMode;
}): SessionFormValues {
  return {
    title: session.title,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    courtNumber: session.courtNumber,
    skillLevel: session.skillLevel,
    maxPlayers: session.maxPlayers,
    courtCount: session.courtCount,
    targetScore: session.targetScore,
    winBy: session.winBy,
    paymentRequired: session.paymentRequired,
    paymentAmount: session.paymentAmount?.toString() ?? "",
    paymentNote: session.paymentNote ?? "",
    paymentInstructions: session.paymentInstructions ?? "",
    allowUnpaidInQueue: session.allowUnpaidInQueue,
    autoAssignNextMatch: session.autoAssignNextMatch,
    allowSideChange: session.allowSideChange,
    sideChangePoint: session.sideChangePoint,
    skillMatchingMode: session.skillMatchingMode,
  };
}
