export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

type MovementRow = {
  id: string;
  date: string;
  type: "IN" | "OUT" | "TRANSFER";
  ring_number: string;
  from_producer_id: string | null;
  to_producer_id: string | null;
  out_reason: string | null;
  transfer_reason: string | null;
  weight_kg: number | null;
  notes: string | null;
};

type Producer = { id: string; name: string | null };

export default async function RingDetailPage({ params }: { params: { ring_number: string } }) {
  const ring_number = decodeURIComponent(params.ring_number);

  const supabase = await createClient();
  const { user, profile } = await getProfile();

  if (!user || !profile) {
    return (
      <div className="p-6 space-y-3">
        <p>Sessão inválida. Volte a fazer login.</p>
        <Link className="text-sm underline" href="/login">
          Ir para login
        </Link>
      </div>
    );
  }

  const { data: rooster } = await supabase
    .from("roosters")
    .select("ring_number, status, current_producer_id")
    .eq("ring_number", ring_number)
    .maybeSingle();

  if (!rooster) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Anilha {ring_number}</h1>
        <p className="text-sm opacity-70">Não encontrada.</p>
        <Link className="text-sm underline" href="/app/anilha">
          Voltar
        </Link>
      </div>
    );
  }

  // PRODUCER: tem de ter ligação nos movements (origem ou destino)
  if (profile.role !== "ADMIN") {
    const pid = profile.producer_id ?? "";

    const { data: linked } = await supabase
      .from("movements")
      .select("id")
      .eq("ring_number", ring_number)
      .or(`from_producer_id.eq.${pid},to_producer_id.eq.${pid}`)
      .limit(1);

    if (!linked?.length) {
      return (
        <div className="p-6 space-y-3">
          <h1 className="text-xl font-semibold">Anilha {ring_number}</h1>
          <p className="text-sm text-red-600">Sem permissão para ver esta anilha.</p>
          <Link className="text-sm underline" href="/app/anilha">
            Voltar
          </Link>
        </div>
      );
    }
  }

  const { data: producersData } = await supabase.from("producers").select("id, name");
  const producerNameById: Record<string, string> = {};
  (producersData as Producer[] | null)?.forEach((p) => (producerNameById[p.id] = p.name ?? p.id));

  const { data: movements, error } = await supabase
    .from("movements")
    .select("id, date, type, ring_number, from_producer_id, to_producer_id, out_reason, transfer_reason, weight_kg, notes")
    .eq("ring_number", ring_number)
    .order("date", { ascending: true });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Anilha {ring_number}</h1>
          <p className="text-sm opacity-70">
            Estado: <span className="font-medium">{rooster.status}</span>
          </p>
        </div>
        <Link className="text-sm underline" href="/app/anilha">
          Voltar
        </Link>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Histórico</h2>

        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!movements?.length ? (
          <p className="text-sm opacity-70">Sem movimentos.</p>
        ) : (
          <div className="space-y-2">
            {(movements as MovementRow[]).map((m) => (
              <div key={m.id} className="rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {m.type === "IN" && "Entrada"}
                    {m.type === "OUT" && "Saída"}
                    {m.type === "TRANSFER" && "Transferência"}
                  </div>
                  <div className="text-xs opacity-70">{new Date(m.date).toLocaleString("pt-PT")}</div>
                </div>

                <div className="text-sm mt-1 space-y-1">
                  {m.type === "TRANSFER" && (
                    <div className="opacity-80">
                      {producerNameById[m.from_producer_id ?? ""] ?? "—"} → {producerNameById[m.to_producer_id ?? ""] ?? "—"}
                      {m.transfer_reason ? ` · ${m.transfer_reason}` : ""}
                    </div>
                  )}

                  {m.type === "OUT" && (
                    <div className="opacity-80">
                      Motivo: {m.out_reason ?? "—"}
                      {m.weight_kg != null ? ` · ${m.weight_kg} kg` : ""}
                    </div>
                  )}

                  {m.notes && <div className="opacity-80">Notas: {m.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
