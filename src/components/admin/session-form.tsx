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
import {
  FREE_SESSION_PAYMENT_NOTE,
  MAX_SESSION_PLAYERS,
  SESSION_SKILL_LEVELS,
  SKILL_MATCHING_MODES,
} from "@/lib/constants";
import {
  type CourtScheduleEntry,
  courtSchedulesFromCourts,
  courtsUseSessionRentalTime,
  syncCourtScheduleCount,
  validateCourtSchedules,
} from "@/lib/court-schedule";
import { IntegerInput } from "@/components/integer-input";
import {
  clampPaymentAmount,
  clampSessionCourtCount,
  clampSessionMaxPlayers,
  clampSideChangePoint,
  clampTargetScore,
  clampWinBy,
  MIN_SESSION_PLAYERS,
  parsePaymentAmountInput,
  sanitizeDecimalTyping,
} from "@/lib/numbers";
import type { Court, SessionSkillLevel, SkillMatchingMode } from "@/types";
import { adminFormWidth, fieldWidth2xl, fieldWidthLg, fieldWidthMd, fieldWidthSm, fieldWidthXl, fieldWidthXs } from "@/lib/layout";
import { adminCardClass } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export interface SessionFormValues {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  skillLevel: SessionSkillLevel;
  maxPlayers: number;
  courtCount: number;
  courtsUseSessionTime: boolean;
  courtSchedules: CourtScheduleEntry[];
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
    skillLevel: "Mixed",
    maxPlayers: 8,
    courtCount: 1,
    courtsUseSessionTime: true,
    courtSchedules: [
      { courtNumber: 1, startTime: "08:00", endTime: "10:00" },
    ],
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
  className,
}: {
  values: SessionFormValues;
  onChange: (values: SessionFormValues) => void;
  showBasics?: boolean;
  className?: string;
}) {
  const set = <K extends keyof SessionFormValues>(
    key: K,
    value: SessionFormValues[K]
  ) => onChange({ ...values, [key]: value });

  return (
    <div className={cn("space-y-4", adminFormWidth, className)}>
      {showBasics && (
        <Card className={adminCardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Details</CardTitle>
            <CardDescription>
              Session info and the overall schedule shown to players
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Morning Open Play"
                className={cn("rounded-2xl border-2 border-black/10", fieldWidth2xl)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={values.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={cn("rounded-2xl border-2 border-black/10", fieldWidthMd)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max players</Label>
                <IntegerInput
                  id="maxPlayers"
                  value={values.maxPlayers}
                  onChange={(v) => set("maxPlayers", v)}
                  min={MIN_SESSION_PLAYERS}
                  max={MAX_SESSION_PLAYERS}
                  maxDigits={3}
                  fallback={8}
                  className={fieldWidthSm}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {MIN_SESSION_PLAYERS}–{MAX_SESSION_PLAYERS} players
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={values.startTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    onChange({
                      ...values,
                      startTime,
                      courtSchedules: values.courtsUseSessionTime
                        ? syncCourtScheduleCount(
                            values.courtSchedules,
                            values.courtCount,
                            startTime,
                            values.endTime
                          )
                        : values.courtSchedules,
                    });
                  }}
                  className={cn("rounded-2xl border-2 border-black/10", fieldWidthMd)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={values.endTime}
                  onChange={(e) => {
                    const endTime = e.target.value;
                    onChange({
                      ...values,
                      endTime,
                      courtSchedules: values.courtsUseSessionTime
                        ? syncCourtScheduleCount(
                            values.courtSchedules,
                            values.courtCount,
                            values.startTime,
                            endTime
                          )
                        : values.courtSchedules,
                    });
                  }}
                  className={cn("rounded-2xl border-2 border-black/10", fieldWidthMd)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Default window for the session. Per-court rental times can differ
                  in Court Settings.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                className={cn("rounded-2xl border-2 border-black/10", fieldWidthXl)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Session skill</Label>
              <Select
                value={values.skillLevel}
                onValueChange={(v) => set("skillLevel", v as SessionSkillLevel)}
              >
                <SelectTrigger className={cn("rounded-2xl border-2 border-black/10", fieldWidthLg)}>
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
          </CardContent>
        </Card>
      )}

      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Settings</CardTitle>
          <CardDescription>Payment rules for joining</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckboxField
            id="paymentRequired"
            label="Require payment"
            checked={values.paymentRequired}
            onChange={(v) =>
              onChange({
                ...values,
                paymentRequired: v,
                allowUnpaidInQueue: v ? values.allowUnpaidInQueue : true,
              })
            }
          />
          {!values.paymentRequired && (
            <p className="rounded-2xl border border-sisclub-green/25 bg-sisclub-green/10 px-3 py-2 text-sm font-medium text-sisclub-green-dark">
              {FREE_SESSION_PAYMENT_NOTE} Players will see this on the schedule
              and join form.
            </p>
          )}
          <div
            className={cn(
              "space-y-3",
              !values.paymentRequired && "pointer-events-none opacity-50"
            )}
          >
          <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
            <div className="space-y-2">
              <Label>Payment amount</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={values.paymentAmount}
                onChange={(e) =>
                  set("paymentAmount", sanitizeDecimalTyping(e.target.value))
                }
                onBlur={() => {
                  const parsed = parsePaymentAmountInput(values.paymentAmount);
                  if (parsed != null) {
                    set(
                      "paymentAmount",
                      String(clampPaymentAmount(parsed))
                    );
                  }
                }}
                placeholder="0.00"
                className={cn("rounded-2xl border-2 border-black/10", fieldWidthSm)}
                disabled={!values.paymentRequired}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment note</Label>
              <Input
                value={values.paymentNote}
                onChange={(e) => set("paymentNote", e.target.value)}
                placeholder="e.g. GCash"
                className={cn("rounded-2xl border-2 border-black/10", fieldWidthLg)}
                disabled={!values.paymentRequired}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment instructions</Label>
            <textarea
              value={values.paymentInstructions}
              onChange={(e) => set("paymentInstructions", e.target.value)}
              rows={2}
              className={cn(
                "rounded-2xl border-2 border-black/10 bg-transparent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60",
                fieldWidth2xl
              )}
              placeholder="Send payment to…"
              disabled={!values.paymentRequired}
            />
          </div>
          </div>
        </CardContent>
      </Card>

      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Match Rules</CardTitle>
          <CardDescription>Scoring and side-change behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:max-w-md sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Target score</Label>
              <IntegerInput
                value={values.targetScore}
                onChange={(v) => set("targetScore", v)}
                min={1}
                max={99}
                maxDigits={2}
                fallback={15}
                className={fieldWidthXs}
              />
            </div>
            <div className="space-y-2">
              <Label>Win by</Label>
              <IntegerInput
                value={values.winBy}
                onChange={(v) => set("winBy", v)}
                min={1}
                max={20}
                maxDigits={2}
                fallback={2}
                className={fieldWidthXs}
              />
            </div>
            <div className="space-y-2">
              <Label>Side change at</Label>
              <IntegerInput
                value={values.sideChangePoint}
                onChange={(v) => set("sideChangePoint", v)}
                min={1}
                max={Math.max(1, values.targetScore - 1)}
                maxDigits={2}
                fallback={8}
                className={fieldWidthXs}
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

      <Card className={adminCardClass}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Court Settings</CardTitle>
          <CardDescription>
            Live queue courts for matches. These are separate from the session
            location label above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Number of courts</Label>
            <IntegerInput
              value={values.courtCount}
              onChange={(v) =>
                onChange({
                  ...values,
                  courtCount: v,
                  courtSchedules: syncCourtScheduleCount(
                    values.courtSchedules,
                    clampSessionCourtCount(v),
                    values.startTime,
                    values.endTime
                  ),
                })
              }
              min={1}
              max={12}
              maxDigits={2}
              fallback={1}
              className={fieldWidthSm}
            />
            <p className="text-xs text-muted-foreground">
              Creates Court 1, Court 2, … for the live queue and match
              assignment.
            </p>
          </div>

          <CheckboxField
            id="courtsUseSessionTime"
            label="All courts use the session start/end time"
            checked={values.courtsUseSessionTime}
            onChange={(checked) =>
              onChange({
                ...values,
                courtsUseSessionTime: checked,
                courtSchedules: checked
                  ? syncCourtScheduleCount(
                      values.courtSchedules,
                      values.courtCount,
                      values.startTime,
                      values.endTime
                    )
                  : syncCourtScheduleCount(
                      [],
                      values.courtCount,
                      values.startTime,
                      values.endTime
                    ),
              })
            }
          />

          {!values.courtsUseSessionTime && (
            <div className="space-y-3 rounded-2xl border-2 border-black/5 bg-white/60 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Rental time per court
              </p>
              {values.courtSchedules.map((schedule, index) => (
                <div
                  key={schedule.courtNumber}
                  className="grid grid-cols-1 gap-2 border-t border-black/5 pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_minmax(0,9rem)_minmax(0,9rem)]"
                >
                  <p className="pt-2 text-sm font-semibold text-sisclub-green-dark">
                    Court {schedule.courtNumber}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">Rental start</Label>
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => {
                        const next = [...values.courtSchedules];
                        next[index] = {
                          ...schedule,
                          startTime: e.target.value,
                        };
                        onChange({ ...values, courtSchedules: next });
                      }}
                      className="rounded-2xl border-2 border-black/10"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rental end</Label>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => {
                        const next = [...values.courtSchedules];
                        next[index] = {
                          ...schedule,
                          endTime: e.target.value,
                        };
                        onChange({ ...values, courtSchedules: next });
                      }}
                      className="rounded-2xl border-2 border-black/10"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={adminCardClass}>
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
              <SelectTrigger className={cn("rounded-2xl border-2 border-black/10", fieldWidthLg)}>
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
          {values.paymentRequired && (
            <CheckboxField
              id="allowUnpaidInQueue"
              label="Allow unpaid players in queue"
              checked={values.allowUnpaidInQueue}
              onChange={(v) => set("allowUnpaidInQueue", v)}
            />
          )}
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

export type SessionFormSavePayload = ReturnType<typeof sessionFormToPayload>;

export function sessionFormToPayload(values: SessionFormValues) {
  const targetScore = clampTargetScore(values.targetScore);
  const courtCount = clampSessionCourtCount(values.courtCount);
  const courtSchedules = syncCourtScheduleCount(
    values.courtSchedules,
    courtCount,
    values.startTime,
    values.endTime
  );
  const scheduleError = validateCourtSchedules(
    courtSchedules,
    values.courtsUseSessionTime
  );
  if (scheduleError) {
    throw new Error(scheduleError);
  }

  return {
    session: {
      title: values.title.trim(),
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      location: values.location.trim(),
      courtNumber: courtCount === 1 ? "1" : `1-${courtCount}`,
      skillLevel: values.skillLevel,
      maxPlayers: clampSessionMaxPlayers(values.maxPlayers),
      courtCount,
      targetScore,
      winBy: clampWinBy(values.winBy),
      paymentRequired: values.paymentRequired,
      paymentAmount:
        values.paymentRequired && values.paymentAmount
          ? clampPaymentAmount(
              parsePaymentAmountInput(values.paymentAmount) ?? 0
            )
          : undefined,
      paymentNote:
        values.paymentRequired
          ? values.paymentNote.trim() || undefined
          : undefined,
      paymentInstructions:
        values.paymentRequired
          ? values.paymentInstructions.trim() || undefined
          : undefined,
      allowUnpaidInQueue: values.paymentRequired
        ? values.allowUnpaidInQueue
        : true,
      autoAssignNextMatch: values.autoAssignNextMatch,
      allowSideChange: values.allowSideChange,
      sideChangePoint: clampSideChangePoint(
        values.sideChangePoint,
        targetScore
      ),
      skillMatchingMode: values.skillMatchingMode,
    },
    courtSchedules: values.courtsUseSessionTime ? null : courtSchedules,
  };
}

export function sessionToFormValues(
  session: {
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
},
  courts: Pick<Court, "courtNumber" | "rentalStartTime" | "rentalEndTime">[] = []
): SessionFormValues {
  const courtsUseSessionTime = courtsUseSessionRentalTime(courts);
  const courtSchedules = courtSchedulesFromCourts(
    courts,
    session.courtCount,
    session.startTime,
    session.endTime
  );

  return {
    title: session.title,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    skillLevel: session.skillLevel,
    maxPlayers: session.maxPlayers,
    courtCount: session.courtCount,
    courtsUseSessionTime,
    courtSchedules,
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
