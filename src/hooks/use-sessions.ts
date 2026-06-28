"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  fetchSessions,
  type SessionListScope,
} from "@/utils/supabase/queries";
import type { Session } from "@/types";

async function loadSessions(scope: SessionListScope): Promise<{
  sessions: Session[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const data = await fetchSessions(supabase, scope);
    return { sessions: data, error: null };
  } catch (err) {
    return {
      sessions: [],
      error: err instanceof Error ? err.message : "Failed to load sessions",
    };
  }
}

export function useSessions(scope: SessionListScope = "today") {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await loadSessions(scope);
    setSessions(result.sessions);
    setError(result.error);
    setIsLoading(false);
  }, [scope]);

  useEffect(() => {
    let cancelled = false;

    loadSessions(scope).then((result) => {
      if (cancelled) return;
      setSessions(result.sessions);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  return { sessions, isLoading, error, refetch };
}
