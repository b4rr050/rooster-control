"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

function asNumberOrNull(v: string): number | null {
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  return null;
}

export async function exitRoosterAction(formData: FormData) {
  const ring_number = String(formData.get("ring_number") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const weightStr = String(formData.get("weight") ?? "").trim();
  const weight = weightStr ? asNumberOrNull(weightStr) : null;

  if (!ring_number) return { ok: false, error: "Indique a anilha." };
  if (!reason) return { ok: false, error: "Indique o motivo." };
  if (weightStr && weight === null) return { ok: false, error: "Peso inválido." };

  const supabase = await createClient();
  const profile = await getProfile();

  // Apenas para garantir que está autenticado
  if (!profile?.id) return { ok: false, error: "Sessão inválida." };

  const { error } = await supabase.rpc("exit_rooster", {
    p_ring_number: ring_number,
    p_reason: reason,
    p_weight: weight,
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function transferRoosterAction(formData: FormData) {
  const ring_number = String(formData.get("ring_number") ?? "").trim();
  const to_producer_id = String(formData.get("to_producer_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!ring_number) return { ok: false, error: "Indique a anilha." };
  if (!to_producer_id) return { ok: false, error: "Indique o produtor de destino." };
  if (!reason) return { ok: false, error: "Indique o motivo." };

  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile?.id) return { ok: false, error: "Sessão inválida." };

  const { error } = await supabase.rpc("transfer_rooster", {
    p_ring_number: ring_number,
    p_to_producer_id: to_producer_id,
    p_reason: reason,
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
