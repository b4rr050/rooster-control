import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("user_id", userData.user.id)
    .single();

  if (!me || me.role !== "ADMIN" || me.is_active !== true) {
    return NextResponse.json({ error: "Sem permissões." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const user_id = body.user_id as string;

  const admin = createAdminClient();

  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("is_active")
    .eq("user_id", user_id)
    .single();

  if (profErr || !prof) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 400 });

  const nextActive = !prof.is_active;

  const { error } = await admin
    .from("profiles")
    .update({ is_active: nextActive })
    .eq("user_id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, is_active: nextActive });
}
