import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("user_id", userData.user.id)
    .single();

  if (meErr) return NextResponse.json({ error: meErr.message }, { status: 400 });

  if (!me || me.role !== "ADMIN" || me.is_active !== true) {
    return NextResponse.json({ error: "Sem permissões." }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "200"), 1000);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("movements")
    .select("id,date,ring_number,out_reason,weight_kg,notes,from_producer_id,producers:from_producer_id(name)")
    .eq("type", "OUT")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data ?? [] });
}
