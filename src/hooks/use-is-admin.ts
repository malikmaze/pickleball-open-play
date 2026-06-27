"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .ilike("email", user.email)
          .maybeSingle();
        if (!cancelled) setIsAdmin(!!admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading };
}
