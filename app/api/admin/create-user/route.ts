import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeNif(nif: string) {
  return nif.replace(/\s+/g, "").replace(/[^\d]/g, "");
}

function isValidPortugueseNif(nif: string) {
  return /^\d{9}$/.test(nif);
}

function generateTempPassword() {
  const a = Math.random().toString(36).slice(2, 6);
  const b = Math.random().toString(36).slice(2, 6);
  return `Galo-${a}-${b}!`;
}

export async function POST(req: Request) {
  // 1) confirmar que quem chama está autenticado e é ADMIN (via anon client + RLS)
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (meErr || !me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissões." }, { status: 403 });
  }

  // 2) payload
  const body = await req.json();

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const nifRaw = String(body.nif ?? "").trim();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Obrigatório: nome e email." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const nif = normalizeNif(nifRaw);
  if (nifRaw && !isValidPortugueseNif(nif)) {
    return NextResponse.json(
      { error: "NIF inválido (9 dígitos)." },
      { status: 400 }
    );
  }

  // 3) Admin client (service role) para criar produtor + user + profile
  const admin = createAdminClient();

  // 3a) criar PRODUTOR automaticamente (Solução A)
  const { data: producer, error: prodErr } = await admin
    .from("producers")
    .insert({ name })
    .select("id")
    .single();

  if (prodErr || !producer) {
    return NextResponse.json(
      { error: `Erro ao criar produtor: ${prodErr?.message ?? "desconhecido"}` },
      { status: 400 }
    );
  }

  // 3b) criar USER com password temporária
  const tempPassword = generateTempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createErr) {
    // rollback: apagar produtor criado
    await admin.from("producers").delete().eq("id", producer.id);
    return NextResponse.json({ error: createErr.message }, { status: 400 });
  }

  const newUserId = created.user?.id;
  if (!newUserId) {
    await admin.from("producers").delete().eq("id", producer.id);
    return NextResponse.json({ error: "Falha a obter user id." }, { status: 500 });
  }

  // 3c) criar PROFILE ligado ao produtor criado
  const { error: profErr } = await admin.from("profiles").insert({
    user_id: newUserId,
    name,
    role: "PRODUCER",
    producer_id: producer.id,
    phone: phone || null,
    address: address || null,
    nif: nif || null,
    is_active: true,
  });

  if (profErr) {
    // rollback: apagar user e produtor
    await admin.auth.admin.deleteUser(newUserId);
    await admin.from("producers").delete().eq("id", producer.id);
    return NextResponse.json({ error: profErr.message }, { status: 400 });
  }

  // 4) devolver password temporária (mostrar uma vez)
  return NextResponse.json({
    ok: true,
    tempPassword,
  });
}