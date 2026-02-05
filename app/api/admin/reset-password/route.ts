import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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
  const user_id = String(body.user_id ?? "").trim();
  if (!user_id) return NextResponse.json({ error: "user_id obrigatório" }, { status: 400 });

  const admin = createAdminClient();

  const newPassword = randomPassword(12);

  const { error } = await admin.auth.admin.updateUserById(user_id, {
    password: newPassword,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // devolvemos a password para o admin copiar e enviar ao produtor
  return NextResponse.json({ ok: true, temp_password: newPassword });
}
