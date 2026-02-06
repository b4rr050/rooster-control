"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

function asNumberOrNull(v: string): number | null {
  const n = Number(v.replace(",", "."));
  if (Number.isFinite(n)) return n;
  return null;
}

const OUT_REASONS = ["ABATE", "VENDA", "MORTE", "PERDA", "OUTRO"] as const;
const TRANSFER_REASONS = ["VENDA", "TROCA", "OUTRO"] as const;

export async function exitRoosterAction(formData: FormData) {
  const ring_number = String(formData.get("ring_number") ?? "").trim();
  const out_reason = String(formData.get("out_reason") ?? "").trim().toUpperCase();
  const weightStr = String(formData.get("weight_kg") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!ring_number) return { ok: false, error: "Indique a anilha." };
  if (!OUT_REASONS.includes(out_reason as any)) return { ok: false, error: "Motivo de saída inválido." };

  const weight_kg = weightStr ? asNumberOrNull(weightStr) : null;
  if (weightStr && weight_kg === null) return { ok: false, error: "Peso inválido." };

  const supabase = await createClient();
  const { user, profile } = await getProfile();

  if (!user || !profile) return { ok: false, error: "Sessão inválida." };

  const { error } = await supabase.rpc("exit_rooster", {
    p_ring_number: ring_number,
    p_out_reason: out_reason,
    p_weight_kg: weight_kg,
    p_notes: notes || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function transferRoosterAction(formData: FormData) {
  const ring_number = String(formData.get("ring_number") ?? "").trim();
  const to_producer_id = String(formData.get("to_producer_id") ?? "").trim();
  const transfer_reason = String(formData.get("transfer_reason") ?? "").trim().toUpperCase();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!ring_number) return { ok: false, error: "Indique a anilha." };
  if (!to_producer_id) return { ok: false, error: "Indique o produtor de destino." };
  if (!TRANSFER_REASONS.includes(transfer_reason as any))
    return { ok: false, error: "Motivo de transferência inválido." };

  const supabase = await createClient();
  const { user, profile } = await getProfile();

  if (!user || !profile) return { ok: false, error: "Sessão inválida." };

  const { error } = await supabase.rpc("transfer_rooster", {
    p_ring_number: ring_number,
    p_to_producer_id: to_producer_id,
    p_transfer_reason: transfer_reason,
    p_notes: notes || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function parseRingNumbers(raw: string): string[] {
  const parts = raw
    .split(/[\n,;\t ]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

export async function transferRoostersBulkAction(formData: FormData) {
  const ring_numbers_raw = String(formData.get("ring_numbers") ?? "");
  const to_producer_id = String(formData.get("to_producer_id") ?? "").trim();
  const transfer_reason = String(formData.get("transfer_reason") ?? "").trim().toUpperCase();
  const notes = String(formData.get("notes") ?? "").trim();

  const ring_numbers = parseRingNumbers(ring_numbers_raw);

  if (!ring_numbers.length) return { ok: false, error: "Indique pelo menos uma anilha." };
  if (!to_producer_id) return { ok: false, error: "Indique o produtor de destino." };
  if (!TRANSFER_REASONS.includes(transfer_reason as any))
    return { ok: false, error: "Motivo de transferência inválido." };

  const supabase = await createClient();
  const { user, profile } = await getProfile();

  if (!user || !profile) return { ok: false, error: "Sessão inválida." };

  const results: { ring_number: string; ok: boolean; error?: string }[] = [];

  for (const rn of ring_numbers) {
    const { error } = await supabase.rpc("transfer_rooster", {
      p_ring_number: rn,
      p_to_producer_id: to_producer_id,
      p_transfer_reason: transfer_reason,
      p_notes: notes || null,
    });

    if (error) results.push({ ring_number: rn, ok: false, error: error.message });
    else results.push({ ring_number: rn, ok: true });
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;

  return {
    ok: failCount === 0,
    summary: { total: results.length, ok: okCount, failed: failCount },
    results,
  };
}
