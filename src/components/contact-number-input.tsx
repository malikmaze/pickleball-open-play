"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PH_MOBILE_PLACEHOLDER,
  sanitizeContactInput,
} from "@/lib/phone";

export function ContactNumberInput({
  id = "contact",
  label = "Contact number",
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  className,
  inputClassName,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={PH_MOBILE_PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(sanitizeContactInput(e.target.value))}
        className={cn(
          "h-12 rounded-2xl border-2 border-black/10",
          error && "border-destructive/50",
          inputClassName
        )}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
