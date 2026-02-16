import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData.user;

    const gp = await getProfile();

    return NextResponse.json({
      ok: true,
      user_ok: !!user,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      user_error: userErr?.message ?? null,
      profile_ok: !!gp.profile,
      profile_role: gp.profile?.role ?? null,
      profile_user_id: gp.profile?.user_id ?? null,
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
