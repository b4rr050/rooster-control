import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData.user;

    // Query direta ao profiles (para ver o erro real)
    let profile = null;
    let profileErr: string | null = null;

    if (user) {
      const res = await supabase
        .from("profiles")
        .select("user_id,role,is_active,producer_id,name,phone,address,nif,created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      profile = res.data ?? null;
      profileErr = res.error?.message ?? null;
    }

    return NextResponse.json({
      ok: true,
      user_ok: !!user,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_error: userErr?.message ?? null,

      profile_ok: !!profile,
      profile_role: profile?.role ?? null,
      profile_user_id: profile?.user_id ?? null,
      profile_error: profileErr,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e?.message ?? e),
        stack: String(e?.stack ?? ""),
      },
      { status: 500 }
    );
  }
}
