"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { checkIsAdmin } from "@/utils/supabase/queries";
import type { UserRole } from "@/types";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("guest");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setRole("guest");
        return;
      }

      const isAdmin = await checkIsAdmin(supabase);
      if (!isAdmin) {
        await supabase.auth.signOut();
        setUser(null);
        setRole("guest");
        return;
      }

      setUser(authUser);
      setRole("admin");
    } catch {
      setUser(null);
      setRole("guest");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async Supabase session fetch
    void refresh();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setRole("guest");
    router.push("/dashboard");
    router.refresh();
  }, [router]);

  return {
    user,
    role,
    loading,
    isGuest: role === "guest",
    isAdmin: role === "admin",
    signOut,
    refresh,
  };
}
