export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

type MovementRow = {
  id: string;
  created_at: string;
  type: "IN" | "OUT" | "TRANSFER";
  ring_number: string;
  reason: string | null;
  weight: number | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

type Producer = { id: string; name: string | null };

export default async function RingDetailPage({ params }: { params: { ring_number: string } }) {
  const ring_number = decodeURIComponent(params.ring_number);

  const supabase = await createClient();
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="p-6">
        <p>Sessão inválida. Volte a fazer login.</p>
      </div>
    );
  }

  // buscar rooster (para verificar acesso no PRODUCER)
  const { data: rooster } = await supabase
    .from("roosters")
    .select("id, ring_number, status, current_producer_id")
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

  // PRODUCER: só vê se a anilha é/foi dele (simplificação: valida pelo current_producer_id)
  // Se quiseres histórico mesmo após OUT/transfer (mais correcto), fazemos validação via movements.
  if (profile.role !== "ADMIN") {
    const pid = profile.producer_id ?? "";
    const isOwnerNow = rooster.current_producer_id === pid;

    if (!isOwnerNow) {
      // fallback: já pode ter sido dele no passado
      const { data: ownedBefore } = await supabase
        .from("movements")
        .select("id")
        .eq("ring_number", ring_number)
        .or(`from_producer_id.eq.${pid},to_producer_id.eq.${pid}`)
        .limit(1);

      if (!ownedBefore?.length) {
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
  }

  // produtores para nomes (opcional)
  const { data: producersData } = await supabase.from("producers").select("id, name");
  const producerNameById: Record<string, string> = {};
  (producersData as Producer[] | null)?.forEach((p) => (producerNameById[p.id] = p.name ?? p.id));

  const { data: movements, error } = await supabase
    .from("movements")
    .select("id, created_at, type, ring_number, reason, weight, from_producer_id, to_producer_id")
    .eq("ring_number", ring_number)
    .order("created_at", { ascending: true });

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
                  <div className="text-xs opacity-70">{new Date(m.created_at).toLocaleString("pt-PT")}</div>
                </div>

                <div className="text-sm mt-1">
                  {m.type === "TRANSFER" && (
                    <div className="opacity-80">
                      {producerNameById[m.from_producer_id ?? ""] ?? "—"} → {producerNameById[m.to_producer_id ?? ""] ?? "—"}
                    </div>
                  )}
                  {m.reason && <div className="opacity-80">Motivo: {m.reason}</div>}
                  {m.weight != null && <div className="opacity-80">Peso: {m.weight} kg</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
