import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rings: string[] = Array.isArray(body.rings) ? body.rings : [];
  const producer_id: string = body.producer_id;
  const weight_kg: number | null = body.weight_kg ?? null;
  const notes: string | null = body.notes ?? null;

  const { data, error } = await supabase.rpc("admin_assign_rings_to_producer", {
    p_rings: rings,
    p_producer_id: producer_id,
    p_weight_kg: weight_kg,
    p_notes: notes,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ count: data ?? 0 });
}
