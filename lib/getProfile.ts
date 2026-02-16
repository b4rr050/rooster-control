import { createClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  user_id: string;
  email: string | null;
  role: "ADMIN" | "PRODUCER";
  is_active: boolean;
  producer_id: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  nif?: string | null;
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
    .select("id,user_id,email,role,is_active,producer_id,name,phone,address,nif")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  // Se houver erro (RLS, etc.), devolvemos profile null
  if (error || !data) {
    return { user, profile: null };
  }

  return { user, profile: data as any };
}
