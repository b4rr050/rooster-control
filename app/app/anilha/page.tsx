export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

type RoosterRowAdmin = {
  ring_number: string;
  status: "ACTIVE" | "EXITED";
  current_producer_id: string | null;
  created_at: string;
  // Supabase tipa o join como array
  producers?: { name: string | null }[] | null;
};

type RoosterRow = {
  ring_number: string;
  status: "ACTIVE" | "EXITED";
  current_producer_id: string | null;
  created_at: string;
};

function normStr(v: unknown) {
  return String(v ?? "").trim();
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>;
}

function StatusChip({ status }: { status: "ACTIVE" | "EXITED" }) {
  return <Chip>{status === "ACTIVE" ? "ATIVA" : "SAÍDA"}</Chip>;
}

export default async function AnilhaListPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
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

  const q = normStr(searchParams.q);
  const statusRaw = normStr(searchParams.status).toUpperCase();
  const statusFilter: "ACTIVE" | "EXITED" | "" =
    statusRaw === "ACTIVE" ? "ACTIVE" : statusRaw === "EXITED" ? "EXITED" : "";

  const isAdmin = profile.role === "ADMIN";
  const pid = profile.producer_id ?? "";

  let roosters: RoosterRowAdmin[] = [];
  let errorMsg: string | null = null;

  if (isAdmin) {
    let query = supabase
      .from("roosters")
      .select("ring_number, status, current_producer_id, created_at, producers(name)")
      .order("created_at", { ascending: false })
      .limit(300);

    if (q) query = query.ilike("ring_number", `%${q}%`);
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query;
    if (error) errorMsg = error.message;

    roosters = (data ?? []) as RoosterRowAdmin[];
  } else {
    const { data: currentData, error: currentErr } = await supabase
      .from("roosters")
      .select("ring_number")
      .eq("current_producer_id", pid)
      .limit(1000);

    if (currentErr) errorMsg = currentErr.message;

    const currentRingNumbers = new Set<string>((currentData ?? []).map((r: any) => r.ring_number));

    const { data: movedData, error: movedErr } = await supabase
      .from("movements")
      .select("ring_number")
      .or(`from_producer_id.eq.${pid},to_producer_id.eq.${pid}`)
      .order("date", { ascending: false })
      .limit(2000);

    if (movedErr && !errorMsg) errorMsg = movedErr.message;

    const allRingNumbers = new Set<string>([...currentRingNumbers]);
    (movedData ?? []).forEach((m: any) => allRingNumbers.add(m.ring_number));

    let ringNumbers = Array.from(allRingNumbers);
    if (q) ringNumbers = ringNumbers.filter((rn) => rn.toLowerCase().includes(q.toLowerCase()));

    if (ringNumbers.length === 0) {
      roosters = [];
    } else {
      const chunks: string[][] = [];
      const CHUNK = 200;
      for (let i = 0; i < ringNumbers.length; i += CHUNK) chunks.push(ringNumbers.slice(i, i + CHUNK));

      const collected: RoosterRow[] = [];
      for (const chunk of chunks) {
        let rq = supabase
          .from("roosters")
          .select("ring_number, status, current_producer_id, created_at")
          .in("ring_number", chunk);

        if (statusFilter) rq = rq.eq("status", statusFilter);

        const { data, error } = await rq;
        if (error && !errorMsg) errorMsg = error.message;
        (data ?? []).forEach((r: any) => collected.push(r as RoosterRow));
      }

      collected.sort((a, b) => {
        if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      roosters = collected.slice(0, 300);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Anilhas</h1>
          <p className="text-sm opacity-70">
            {isAdmin ? "Lista global (Admin)." : "Lista do produtor (atuais + histórico)."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm underline" href="/app/transferencia">
            Transferências
          </Link>
          <Link className="text-sm underline" href="/app/saida">
            Saídas
          </Link>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <form className="grid gap-3 md:grid-cols-8" method="GET">
          <div className="md:col-span-4">
            <label className="text-xs opacity-70">Pesquisar</label>
            <input
              name="q"
              defaultValue={q}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="ex: PT-000123"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs opacity-70">Estado</label>
            <select name="status" defaultValue={statusFilter || ""} className="w-full rounded-lg border px-3 py-2">
              <option value="">Todos</option>
              <option value="ACTIVE">Ativas</option>
              <option value="EXITED">Saídas</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button type="submit" className="w-full rounded-lg border px-4 py-2 text-sm">
              Filtrar
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-70">
          <span>Mostra até 300 resultados.</span>
          {q ? <Chip>Pesquisa: {q}</Chip> : <Chip>Sem pesquisa</Chip>}
          {statusFilter ? <Chip>Estado: {statusFilter}</Chip> : <Chip>Estado: todos</Chip>}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-medium">Lista</h2>
          <Chip>{roosters.length} resultados</Chip>
        </div>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        {!roosters.length ? (
          <p className="text-sm opacity-70">Sem resultados.</p>
        ) : (
          <div className="space-y-2">
            {roosters.map((r) => {
              const producerName =
                isAdmin && r.status === "ACTIVE"
                  ? (r.producers?.[0]?.name ?? (r.current_producer_id ? "Produtor (sem nome)" : "—"))
                  : null;

              return (
                <div key={r.ring_number} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">Anilha {r.ring_number}</div>
                      <StatusChip status={r.status} />
                    </div>
                    <div className="text-xs opacity-70">
                      Criada: {new Date(r.created_at).toLocaleString("pt-PT")}
                      {producerName ? ` · Produtor atual: ${producerName}` : ""}
                    </div>
                  </div>

                  <Link className="text-sm underline shrink-0" href={`/app/anilha/${encodeURIComponent(r.ring_number)}`}>
                    Abrir
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
