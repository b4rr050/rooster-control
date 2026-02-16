import { createClient } from "@/lib/supabase/server";

export type ProfileRow = {
  user_id: string;
  name: string | null;
  role: "ADMIN" | "PRODUCER";
  producer_id: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  is_active: boolean;
  created_at: string;
};

export async function getProfile(): Promise<{
  user: { id: string; email?: string | null } | null;
  profile: ProfileRow | null;
}> {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return { user: null, profile: null };
  }

  const user = { id: userData.user.id, email: userData.user.email ?? null };

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,name,role,producer_id,phone,address,nif,is_active,created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return { user, profile: null };

  return { user, profile: data as ProfileRow };
}
