"use client";

import { Input } from "@/components/ui/input";
import {
  clampInteger,
  integerInputDisplay,
  sanitizeIntegerTyping,
} from "@/lib/numbers";
import { cn } from "@/lib/utils";

type IntegerInputProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  maxDigits?: number;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  fallback?: number;
};

export function IntegerInput({
  id,
  value,
  onChange,
  min,
  max,
  maxDigits = 3,
  className,
  required,
  disabled,
  fallback,
}: IntegerInputProps) {
  const resolvedFallback = fallback ?? min;

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={integerInputDisplay(value)}
      onChange={(e) => {
        const sanitized = sanitizeIntegerTyping(e.target.value, maxDigits);
        if (sanitized === "") {
          onChange(0);
          return;
        }
        const parsed = parseInt(sanitized, 10);
        onChange(Number.isNaN(parsed) ? 0 : parsed);
      }}
      onBlur={() => {
        onChange(clampInteger(value, min, max, resolvedFallback));
      }}
      className={cn("rounded-2xl border-2 border-black/10", className)}
      required={required}
      disabled={disabled}
    />
  );
}
