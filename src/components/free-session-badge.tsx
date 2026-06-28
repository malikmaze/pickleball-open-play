"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Irregular sale-starburst — varying spike lengths */
const STARBURST_PATH =
  "M50.00,4.00L57.12,18.80L68.22,12.16L67.46,28.11L87.53,20.07L80.63,35.25L92.90,40.21L80.00,50.00L95.82,60.46L79.73,64.32L83.62,76.81L68.08,72.67L70.83,93.25L57.57,83.15L50.00,95.00L43.10,80.22L30.04,91.44L30.05,75.02L15.60,77.43L22.97,63.02L4.18,60.46L17.00,50.00L8.08,40.43L23.87,37.42L12.47,20.07L28.80,23.42L30.04,8.56L43.10,19.78Z";

/** Wavy ribbon layered over the burst — like the inspo banners */
const BANNER_PATH =
  "M8,57 C16,51 24,53 32,57 S48,53 56,57 S72,53 80,57 S90,54 94,57 L92,71 C84,77 74,75 66,71 S50,75 42,71 S26,75 18,71 S10,74 8,71 Z";

function Sparkle({
  x,
  y,
  size = 4,
  className,
}: {
  x: number;
  y: number;
  size?: number;
  className?: string;
}) {
  const h = size / 2;
  return (
    <path
      d={`M${x},${y - h} L${x + h * 0.35},${y - h * 0.35} L${x + h},${y} L${x + h * 0.35},${y + h * 0.35} L${x},${y + h} L${x - h * 0.35},${y + h * 0.35} L${x - h},${y} L${x - h * 0.35},${y - h * 0.35} Z`}
      className={className}
    />
  );
}

type FreeSessionBadgeProps = {
  className?: string;
  /** Corner sticker on cards vs inline on compact headers */
  variant?: "sticker" | "inline";
};

export function FreeSessionBadge({
  className,
  variant = "inline",
}: FreeSessionBadgeProps) {
  const id = useId();
  const shadowId = `free-sticker-shadow-${id}`;

  return (
    <div
      className={cn(
        "pointer-events-none select-none",
        variant === "sticker" &&
          "absolute -right-2 -top-3 z-20 h-[5.25rem] w-[5.25rem] -rotate-[8deg]",
        variant === "inline" &&
          "relative inline-flex h-[4.5rem] w-[4.5rem] shrink-0 -rotate-[6deg]",
        className
      )}
      role="img"
      aria-label="Free session"
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <filter
            id={shadowId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="1"
              dy="3"
              stdDeviation="2.5"
              floodColor="#e84d7a"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        <g filter={`url(#${shadowId})`}>
          {/* Coral-pink burst + thick vinyl white stroke */}
          <path
            d={STARBURST_PATH}
            fill="#FF6B7A"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinejoin="round"
            paintOrder="stroke fill"
          />

          {/* Layered wavy banner */}
          <path
            d={BANNER_PATH}
            fill="#C084FC"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinejoin="round"
            paintOrder="stroke fill"
          />

          {/* Kawaii eyes */}
          <ellipse cx="41" cy="36" rx="3.2" ry="5.2" fill="#1a1a1a" />
          <ellipse cx="59" cy="36" rx="3.2" ry="5.2" fill="#1a1a1a" />
          <circle cx="42.2" cy="34.2" r="1.1" fill="#FFFFFF" />
          <circle cx="60.2" cy="34.2" r="1.1" fill="#FFFFFF" />

          {/* Banner text */}
          <text
            x="50"
            y="67"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="13"
            fontWeight="900"
            fontFamily="var(--font-heading, system-ui, sans-serif)"
            letterSpacing="0.04em"
          >
            FREE!
          </text>

          {/* Sparkles + heart accents */}
          <Sparkle x={18} y={22} size={5} className="fill-[#FFE566]" />
          <Sparkle x={84} y={28} size={4.5} className="fill-[#FFE566]" />
          <Sparkle x={76} y={82} size={3.5} className="fill-[#FFE566]" />
          <path
            d="M14,78 C14,74 17,72 19,74 C21,72 24,74 24,78 C24,82 19,86 19,86 C19,86 14,82 14,78 Z"
            fill="#FF4D6D"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            paintOrder="stroke fill"
          />
        </g>
      </svg>
    </div>
  );
}
