import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";

type Producer = { id: string; name: string };

type RoosterRow = {
  ring_number: string;
  current_producer_id: string | null;
};

type MovementRow = {
  type: "IN" | "OUT" | "TRANSFER";
  date: string;
  weight_kg: number | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

function startOfTodayISO_UTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  return start.toISOString();
}

export default async function Dashboard() {
  const { user, profile } = await getProfile();

  if (!user) {
    return (
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h1>Não autenticado</h1>
        <a href="/login">Ir para login</a>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h1>Conta desativada / perfil em falta</h1>
        <p>Contacte o administrador.</p>
      </div>
    );
  }

  const supabase = await createClient();

  // Stock (RLS filtra automaticamente: produtor só vê o dele; admin vê tudo)
  const { data: stock, error: stockErr } = await supabase
    .from("roosters")
    .select("ring_number,current_producer_id")
    .eq("status", "ACTIVE")
    .order("ring_number");

  if (stockErr) {
    return (
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h1>Erro</h1>
        <p>{stockErr.message}</p>
      </div>
    );
  }

  const stockRows = (stock ?? []) as RoosterRow[];
  const total = stockRows.length;

  // Se não for ADMIN: dashboard simples
  if (profile.role !== "ADMIN") {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Utilizador</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.name ?? user.email}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>{profile.role}</div>
          </div>

          <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Stock atual</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>{total}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>Galos ativos</div>
          </div>
        </div>

        <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
          <h2 style={{ marginTop: 0 }}>Anilhas ativas</h2>
          {total === 0 ? (
            <p>Sem stock ativo.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {stockRows.slice(0, 50).map(r => (
                <span
                  key={r.ring_number}
                  style={{
                    border: "1px solid #eee",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontFamily: "monospace",
                    background: "#fcfcfc",
                  }}
                >
                  {r.ring_number}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN: carregar produtores + movimentos de hoje
  const todayStart = startOfTodayISO_UTC();

  const [{ data: producers, error: prodErr }, { data: movements, error: movErr }] = await Promise.all([
    supabase.from("producers").select("id,name").order("name"),
    supabase
      .from("movements")
      .select("type,date,weight_kg,from_producer_id,to_producer_id")
      .gte("date", todayStart)
      .order("date", { ascending: false }),
  ]);

  if (prodErr) {
    return (
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h1>Erro</h1>
        <p>{prodErr.message}</p>
      </div>
    );
  }

  if (movErr) {
    return (
      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h1>Erro</h1>
        <p>{movErr.message}</p>
      </div>
    );
  }

  const producersList = (producers ?? []) as Producer[];
  const moves = (movements ?? []) as MovementRow[];

  type Stats = {
    stock: number;
    in: number;
    out: number;
    transfer_in: number;
    transfer_out: number;
    out_weight_sum: number; // kg
  };

  const statsByProducer = new Map<string, Stats>();
  for (const p of producersList) {
    statsByProducer.set(p.id, { stock: 0, in: 0, out: 0, transfer_in: 0, transfer_out: 0, out_weight_sum: 0 });
  }

  // Stock por produtor (roosters.current_producer_id)
  for (const r of stockRows) {
    if (!r.current_producer_id) continue;
    const s = statsByProducer.get(r.current_producer_id);
    if (s) s.stock += 1;
  }

  // Movimentos de hoje por produtor
  for (const m of moves) {
    if (m.type === "IN") {
      // em IN normalmente entra num produtor (to_producer_id). Se vier nulo, tenta from_producer_id.
      const pid = m.to_producer_id ?? m.from_producer_id;
      if (pid && statsByProducer.get(pid)) statsByProducer.get(pid)!.in += 1;
    }

    if (m.type === "OUT") {
      // em OUT normalmente sai do produtor (from_producer_id). Se vier nulo, tenta to_producer_id.
      const pid = m.from_producer_id ?? m.to_producer_id;
      if (pid && statsByProducer.get(pid)) {
        const s = statsByProducer.get(pid)!;
        s.out += 1;
        s.out_weight_sum += Number(m.weight_kg ?? 0);
      }
    }

    if (m.type === "TRANSFER") {
      if (m.from_producer_id && statsByProducer.get(m.from_producer_id)) statsByProducer.get(m.from_producer_id)!.transfer_out += 1;
      if (m.to_producer_id && statsByProducer.get(m.to_producer_id)) statsByProducer.get(m.to_producer_id)!.transfer_in += 1;
    }
  }

  // Totais gerais
  const totals = Array.from(statsByProducer.values()).reduce(
    (acc, s) => {
      acc.stock += s.stock;
      acc.in += s.in;
      acc.out += s.out;
      acc.transfer_in += s.transfer_in;
      acc.transfer_out += s.transfer_out;
      acc.out_weight_sum += s.out_weight_sum;
      return acc;
    },
    { stock: 0, in: 0, out: 0, transfer_in: 0, transfer_out: 0, out_weight_sum: 0 }
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Stock total</div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>{totals.stock}</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>Ativos (todos os produtores)</div>
        </div>

        <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Movimentos hoje</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            IN {totals.in} · OUT {totals.out}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
            TR → {totals.transfer_out} | TR ← {totals.transfer_in}
          </div>
        </div>

        <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Peso saídas hoje</div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>{totals.out_weight_sum.toFixed(2)} kg</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>Soma de OUT (abate/venda/etc.)</div>
        </div>
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>Resumo por produtor (hoje)</h2>

        <div style={{ overflowX: "auto" }}>
          <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Produtor</th>
                <th align="right">Stock</th>
                <th align="right">Entradas</th>
                <th align="right">Saídas</th>
                <th align="right">Peso OUT (kg)</th>
                <th align="right">TR →</th>
                <th align="right">TR ←</th>
              </tr>
            </thead>
            <tbody>
              {producersList.map(p => {
                const s = statsByProducer.get(p.id) ?? {
                  stock: 0,
                  in: 0,
                  out: 0,
                  transfer_in: 0,
                  transfer_out: 0,
                  out_weight_sum: 0,
                };

                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td align="right">{s.stock}</td>
                    <td align="right">{s.in}</td>
                    <td align="right">{s.out}</td>
                    <td align="right">{s.out_weight_sum.toFixed(2)}</td>
                    <td align="right">{s.transfer_out}</td>
                    <td align="right">{s.transfer_in}</td>
                  </tr>
                );
              })}

              {producersList.length === 0 && (
                <tr>
                  <td colSpan={7}>Sem produtores.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>
          “Hoje” está a usar início do dia em UTC. Se quiseres, ajusto para Europe/Lisbon (DST incluído).
        </p>
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>Últimos movimentos (hoje)</h2>
        {moves.length === 0 ? (
          <p>Sem movimentos hoje.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {moves.slice(0, 20).map((m, idx) => (
              <li key={idx}>
                <b>{m.type}</b> — {new Date(m.date).toLocaleString()}{" "}
                {m.type === "OUT" && <>— {Number(m.weight_kg ?? 0).toFixed(2)} kg</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
