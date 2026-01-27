import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // yyyy-mm-dd
  const to = url.searchParams.get("to");     // yyyy-mm-dd
  const reason = url.searchParams.get("reason"); // ABATE|...|ALL
  const producerId = url.searchParams.get("producer_id"); // uuid|ALL
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "200"), 1000);

  const admin = createAdminClient();

  let q = admin
    .from("movements")
    .select(
      "id,date,ring_number,out_reason,weight_kg,notes,from_producer_id, producers:from_producer_id(id,name)",
    )
    .eq("type", "OUT")
    .order("date", { ascending: false })
    .limit(limit);

  if (from) q = q.gte("date", `${from}T00:00:00.000Z`);
  if (to) q = q.lte("date", `${to}T23:59:59.999Z`);
  if (reason && reason !== "ALL") q = q.eq("out_reason", reason);
  if (producerId && producerId !== "ALL") q = q.eq("from_producer_id", producerId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rows: data ?? [] });
}
