import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, is_active, producer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile || profile.is_active !== true) {
    return { user, profile: null };
  }

  return { user, profile };
}
