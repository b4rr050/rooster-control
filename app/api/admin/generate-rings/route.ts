import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  // 1) Validar sessão + role ADMIN (via sessão atual)
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("user_id", userData.user.id)
    .single();

  if (meErr || !me || me.role !== "ADMIN" || me.is_active !== true) {
    return NextResponse.json({ error: "Sem permissões." }, { status: 403 });
  }

  // 2) Ler payload
  const body = await req.json();
  const year = Number(body.year);
  const month = Number(body.month);
  const count = Number(body.count);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Mês inválido (1..12)." }, { status: 400 });
  }
  if (!Number.isInteger(count) || count < 1 || count > 5000) {
    return NextResponse.json({ error: "Quantidade inválida (1..5000)." }, { status: 400 });
  }

  // 3) Gerar via função SQL (service role para não depender de grants/RLS)
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("generate_ring_numbers", {
    p_year: year,
    p_month: month,
    p_count: count,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // data vem como array de { ring_number: "2026.1.0001" }
  const rings = (data ?? []).map((r: any) => r.ring_number);

  return NextResponse.json({ ok: true, rings });
}
