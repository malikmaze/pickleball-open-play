"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchTodaySessions } from "@/utils/supabase/queries";
import type { Session } from "@/types";

async function loadSessions(): Promise<{
  sessions: Session[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const data = await fetchTodaySessions(supabase);
    return { sessions: data, error: null };
  } catch (err) {
    return {
      sessions: [],
      error: err instanceof Error ? err.message : "Failed to load sessions",
    };
  }
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await loadSessions();
    setSessions(result.sessions);
    setError(result.error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadSessions().then((result) => {
      if (cancelled) return;
      setSessions(result.sessions);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { sessions, isLoading, error, refetch };
}
