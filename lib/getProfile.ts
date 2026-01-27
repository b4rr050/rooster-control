import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Auth error:", userErr);
    return { user: null, profile: null };
  }

  if (!userData.user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, producer_id, name, is_active")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("Profile error:", profileErr);
    return { user: userData.user, profile: null };
  }

  if (!profile || !profile.is_active) {
    return { user: userData.user, profile: null };
  }

  return {
    user: userData.user,
    profile,
  };
}
