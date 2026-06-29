"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared card shell for admin surfaces. */
export const adminCardClass =
  "rounded-3xl border-2 border-black/10 bg-white shadow-sm";

export const adminBtnPrimary =
  "rounded-full bg-sisclub-green font-semibold text-white hover:bg-sisclub-green-dark";

export const adminBtnOutline =
  "rounded-full border-2 border-pink-200/60 bg-white/80 text-sisclub-green-dark shadow-sm shadow-pink-100/30 hover:border-pink-300/70 hover:bg-sisclub-pink-soft";

/** Soft playful chrome for session admin shell. */
export const adminShellHeaderClass =
  "border-b border-pink-200/50 bg-gradient-to-b from-sisclub-pink-soft/90 via-white to-white shadow-sm shadow-pink-100/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/90";

export const adminShellLogoClass =
  "relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-pink-300/50 ring-offset-1 ring-offset-white shadow-md shadow-pink-200/40 sm:h-10 sm:w-10";

export const adminShellActionClass =
  "inline-flex h-8 w-full items-center justify-end gap-2 rounded-full px-3.5 py-1 text-sm font-medium text-sisclub-green-dark/80 transition-all hover:scale-[1.02] hover:bg-white hover:text-sisclub-green-dark hover:shadow-sm sm:px-4";

export const adminShellTabTrayClass =
  "flex gap-1.5 overflow-x-auto rounded-2xl bg-gradient-to-r from-pink-50/90 via-white/80 to-emerald-50/40 p-1.5 shadow-inner shadow-pink-100/30 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:snap-none";

export function adminShellTabClass(active: boolean) {
  return cn(
    "inline-flex h-9 shrink-0 snap-start items-center rounded-full px-3.5 text-sm font-semibold transition-all duration-200 sm:px-4",
    active
      ? "bg-sisclub-green text-white shadow-md shadow-sisclub-green/30"
      : "bg-white/70 text-sisclub-green-dark/65 hover:bg-white hover:text-sisclub-green-dark hover:shadow-sm"
  );
}

export const adminSessionTitleCardClass =
  "mb-4 rounded-3xl border border-pink-200/50 bg-gradient-to-br from-white via-pink-50/40 to-emerald-50/30 p-4 shadow-sm shadow-pink-100/35 sm:p-5";

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-bold text-sisclub-green-dark sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminFilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <Button
          key={opt.id}
          type="button"
          variant={value === opt.id ? "default" : "outline"}
          onClick={() => onChange(opt.id)}
          className={cn(
            adminBtnOutline,
            value === opt.id && adminBtnPrimary
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export function AdminCallout({
  title,
  children,
  tone = "info",
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "success" | "warning";
  className?: string;
}) {
  const toneStyles = {
    info: {
      shell:
        "border-sky-200/90 bg-sky-50/95 shadow-sm shadow-sky-100/50",
      accent: "border-l-sky-500",
      title: "text-sky-950",
      body: "text-sky-900/80",
    },
    success: {
      shell:
        "border-emerald-200/90 bg-emerald-50/95 shadow-sm shadow-emerald-100/50",
      accent: "border-l-sisclub-green",
      title: "text-sisclub-green-dark",
      body: "text-emerald-900/85",
    },
    warning: {
      shell:
        "border-amber-200/90 bg-amber-50/95 shadow-sm shadow-amber-100/50",
      accent: "border-l-amber-500",
      title: "text-amber-950",
      body: "text-amber-900/85",
    },
  }[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-l-4 px-4 py-3 text-sm",
        toneStyles.shell,
        toneStyles.accent,
        className
      )}
    >
      <p className={cn("font-semibold", toneStyles.title)}>{title}</p>
      <div className={cn("mt-1 leading-relaxed", toneStyles.body)}>
        {children}
      </div>
    </div>
  );
}

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn(adminCardClass, className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function AdminLoading({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-20",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-sisclub-green" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-2 border-dashed border-black/10 bg-white/60",
        className
      )}
    >
      <CardContent className="py-12 text-center">
        <p className="font-heading text-lg font-bold text-sisclub-green-dark">
          {title}
        </p>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {actions && (
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminActionGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-black/5 pt-3",
        className
      )}
    >
      {children}
    </div>
  );
}
