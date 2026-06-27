"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getPlayerProfile,
  savePlayerProfile as persistProfile,
  subscribePlayerProfile,
} from "@/lib/player-profile";
import type { SkillLevel } from "@/types";

export function usePlayerProfile() {
  const profile = useSyncExternalStore(
    subscribePlayerProfile,
    getPlayerProfile,
    () => null
  );

  const saveProfile = useCallback(
    (data: { name: string; contactNumber?: string; skillLevel: SkillLevel }) => {
      return persistProfile(data);
    },
    []
  );

  return { profile, saveProfile };
}

export {
  getJoinedPlayerId,
  setJoinedPlayerId,
  removeJoinedPlayerId,
} from "@/lib/player-profile";
