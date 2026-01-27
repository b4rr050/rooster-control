import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissões." }, { status: 403 });
  }

  const body = await req.json();
  const targetUserId = String(body.user_id ?? "").trim();
  const isActive = Boolean(body.is_active);

  if (!targetUserId) return NextResponse.json({ error: "user_id em falta." }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("user_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
