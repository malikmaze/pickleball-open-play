import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdminUser(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .ilike("email", user.email)
    .maybeSingle();

  return !!admin;
}
