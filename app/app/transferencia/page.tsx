export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";
import TransferenciaClient from "./transferenciaClient";

type Producer = { id: string; name: string | null };
type MovementRow = {
  id: string;
  created_at: string;
  type: "TRANSFER";
  ring_number: string;
  reason: string | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

export default async function TransferenciaPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="p-6">
        <p>Sessão inválida. Volte a fazer login.</p>
      </div>
    );
  }

  const isAdmin = profile.role === "ADMIN";

  // lista produtores para o dropdown (admin e producer precisam)
  const { data: producersData } = await supabase
    .from("producers")
    .select("id, name")
    .order("name", { ascending: true });

  const producers = (producersData ?? []) as Producer[];

  // histórico: admin vê tudo; producer só transferências onde ele era origem
  let query = supabase
    .from("movements")
    .select("id, created_at, type, ring_number, reason, from_producer_id, to_producer_id")
    .eq("type", "TRANSFER")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isAdmin) {
    query = query.eq("from_producer_id", profile.producer_id ?? "");
  }

  const { data, error } = await query;

  const producerNameById: Record<string, string> = {};
  for (const p of producers) producerNameById[p.id] = p.name ?? p.id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Transferências</h1>
        <Link className="text-sm underline" href="/app/anilha">
          Ver anilhas
        </Link>
      </div>

      <TransferenciaClient role={profile.role} producers={producers} />

      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Histórico</h2>

        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!data?.length ? (
          <p className="text-sm opacity-70">Sem registos.</p>
        ) : (
          <div className="space-y-2">
            {(data as MovementRow[]).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">Anilha {m.ring_number}</div>
                  <div className="text-xs opacity-70">
                    {new Date(m.created_at).toLocaleString("pt-PT")} ·{" "}
                    {producerNameById[m.from_producer_id ?? ""] ?? "—"} →{" "}
                    {producerNameById[m.to_producer_id ?? ""] ?? "—"}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </div>
                </div>

                <Link className="text-sm underline shrink-0" href={`/app/anilha/${encodeURIComponent(m.ring_number)}`}>
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
