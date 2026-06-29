"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  announceCourtCall,
  cancelCourtCall,
  isCourtAnnouncementSupported,
  isCourtAnnouncementsEnabled,
  setCourtAnnouncementsEnabled,
} from "@/lib/court-announcement";
import { cn } from "@/lib/utils";

export function CourtAnnouncementToggle({
  className,
  onEnabledChange,
}: {
  className?: string;
  onEnabledChange?: (enabled: boolean) => void;
}) {
  const [supported] = useState(() => isCourtAnnouncementSupported());
  const [enabled, setEnabled] = useState(() => isCourtAnnouncementsEnabled());

  if (!supported) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setCourtAnnouncementsEnabled(next);
    onEnabledChange?.(next);
    if (next) {
      announceCourtCall(
        "Court announcements are on. Players will be called when assigned to a court.",
        1
      );
    } else {
      cancelCourtCall();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      title={
        enabled
          ? "Court announcements on — tap to mute"
          : "Turn on court announcements"
      }
      className={cn(
        "shrink-0 rounded-full border-2",
        enabled
          ? "border-sisclub-green/40 bg-sisclub-green/10 text-sisclub-green-dark"
          : "border-black/10",
        className
      )}
    >
      {enabled ? (
        <Volume2 className="mr-1.5 h-4 w-4" />
      ) : (
        <VolumeX className="mr-1.5 h-4 w-4" />
      )}
      {enabled ? "Calls on" : "Calls off"}
    </Button>
  );
}
