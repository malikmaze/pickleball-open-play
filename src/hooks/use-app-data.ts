"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getAppData,
  getServerSnapshot,
  setAppData,
  subscribe,
} from "@/lib/app-store";
import type { AppData } from "@/types";

export function useAppData() {
  const data = useSyncExternalStore(subscribe, getAppData, getServerSnapshot);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setAppData(updater(getAppData()));
  }, []);

  return { data, isLoading: false, updateData };
}
