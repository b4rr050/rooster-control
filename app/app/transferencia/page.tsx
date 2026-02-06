export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";
import TransferenciaClient from "./transferenciaClient";

type Producer = { id: string; name: string | null };

type MovementRow = {
  id: string;
  date: string;
  type: "TRANSFER";
  ring_number: string;
  transfer_reason: string | null;
  notes: string | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>;
}

export default async function TransferenciaPage() {
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

  const isAdmin = profile.role === "ADMIN";

  const { data: producersData } = await supabase
    .from("producers")
    .select("id, name")
    .order("name", { ascending: true });

  const producers = (producersData ?? []) as Producer[];

  let query = supabase
    .from("movements")
    .select("id, date, type, ring_number, transfer_reason, notes, from_producer_id, to_producer_id")
    .eq("type", "TRANSFER")
    .order("date", { ascending: false })
    .limit(200);

  if (!isAdmin) {
    query = query.eq("from_producer_id", profile.producer_id ?? "");
  }

  const { data, error } = await query;

  const producerNameById: Record<string, string> = {};
  for (const p of producers) producerNameById[p.id] = p.name ?? p.id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Transferências</h1>
          <p className="text-sm opacity-70">{isAdmin ? "Histórico global (Admin)." : "Transferências do seu produtor."}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm underline" href="/app/anilha">
            Anilhas
          </Link>
          <Link className="text-sm underline" href="/app/saida">
            Saídas
          </Link>
        </div>
      </div>

      <TransferenciaClient role={profile.role} producers={producers} />

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-medium">Histórico</h2>
          <Chip>{data?.length ?? 0} registos</Chip>
        </div>

        {error && <p className="text-sm text-red-600">{error.message}</p>}

        {!data?.length ? (
          <p className="text-sm opacity-70">Sem registos.</p>
        ) : (
          <div className="space-y-2">
            {(data as MovementRow[]).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">Anilha {m.ring_number}</div>
                    {m.transfer_reason ? <Chip>{m.transfer_reason}</Chip> : null}
                  </div>

                  <div className="text-xs opacity-70">
                    {new Date(m.date).toLocaleString("pt-PT")} ·{" "}
                    {producerNameById[m.from_producer_id ?? ""] ?? "—"} → {producerNameById[m.to_producer_id ?? ""] ?? "—"}
                    {m.notes ? ` · ${m.notes}` : ""}
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
