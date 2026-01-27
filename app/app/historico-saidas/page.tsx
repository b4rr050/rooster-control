"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MovementOut = {
  id: string;
  date: string; // timestamptz ISO
  ring_number: string;
  out_reason: "ABATE" | "VENDA" | "MORTE" | "PERDA" | "OUTRO" | null;
  weight_kg: number | null;
  notes: string | null;
};

function toISODate(d: Date) {
  // yyyy-mm-dd
  return d.toISOString().slice(0, 10);
}

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return toISODate(d);
}

function todayISO() {
  return toISODate(new Date());
}

function dayKeyFromISO(iso: string) {
  // agrupar por dia local (Lisboa) de forma simples:
  // (para relatórios perfeitos, faríamos RPC com timezone('Europe/Lisbon', date))
  return iso.slice(0, 10);
}

export default function HistoricoSaidasPage() {
  const supabase = createClient();

  const [from, setFrom] = useState<string>(startOfMonthISO());
  const [to, setTo] = useState<string>(todayISO());
  const [reason, setReason] = useState<string>("ALL");

  const [rows, setRows] = useState<MovementOut[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 200;
  const [page, setPage] = useState(0);

  async function load(p = page) {
    setMsg(null);
    setLoading(true);

    // intervalos: [from 00:00, to 23:59:59]
    const fromISO = `${from}T00:00:00.000Z`;
    const toISO = `${to}T23:59:59.999Z`;

    let q = supabase
      .from("movements")
      .select("id,date,ring_number,out_reason,weight_kg,notes", { count: "exact" })
      .eq("type", "OUT")
      .gte("date", fromISO)
      .lte("date", toISO)
      .order("date", { ascending: false })
      .range(p * pageSize, p * pageSize + pageSize - 1);

    if (reason !== "ALL") q = q.eq("out_reason", reason);

    const { data, error } = await q;

    setLoading(false);

    if (error) {
      setMsg(`Erro: ${error.message}`);
      return;
    }

    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, reason]);

  const summaryByDay = useMemo(() => {
    const map = new Map<string, { day: string; count: number; kg: number }>();

    for (const r of rows) {
      const day = dayKeyFromISO(r.date);
      const cur = map.get(day) ?? { day, count: 0, kg: 0 };
      cur.count += 1;
      cur.kg += Number(r.weight_kg ?? 0);
      map.set(day, cur);
    }

    return Array.from(map.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [rows]);

  const totals = useMemo(() => {
    const count = rows.length;
    const kg = rows.reduce((s, r) => s + Number(r.weight_kg ?? 0), 0);
    return { count, kg };
  }, [rows]);

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Histórico de Saídas</h1>

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Filtros</h2>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>De</div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Até</div>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Motivo</div>
            <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%" }}>
              <option value="ALL">Todos</option>
              <option value="ABATE">Abate</option>
              <option value="VENDA">Venda</option>
              <option value="MORTE">Morte</option>
              <option value="PERDA">Perda</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={() => load(0)} disabled={loading}>
              {loading ? "A carregar..." : "Atualizar"}
            </button>
            <button onClick={() => { setFrom(startOfMonthISO()); setTo(todayISO()); setReason("ALL"); }}>
              Este mês
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
          Nesta página: <b>{totals.count}</b> saídas • <b>{totals.kg.toFixed(3)} kg</b>
        </div>

        {msg && <p style={{ marginTop: 10, marginBottom: 0, color: "crimson" }}>{msg}</p>}
      </section>

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Resumo por dia (desta página)</h2>

        {summaryByDay.length === 0 ? (
          <p>Sem saídas no intervalo selecionado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Dia</th>
                  <th align="right">Nº Saídas</th>
                  <th align="right">Total kg</th>
                </tr>
              </thead>
              <tbody>
                {summaryByDay.map(d => (
                  <tr key={d.day} style={{ borderTop: "1px solid #eee" }}>
                    <td>{d.day}</td>
                    <td align="right">{d.count}</td>
                    <td align="right">{d.kg.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, opacity: 0.7 }}>
              Nota: o resumo é feito sobre os registos carregados nesta página (paginação).
            </p>
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(p); }} disabled={page === 0 || loading}>
            ◀ Anterior
          </button>
          <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={loading || rows.length < pageSize}>
            Seguinte ▶
          </button>
          <span style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
            Página {page + 1}
          </span>
        </div>
      </section>

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Detalhe (desta página)</h2>

        {rows.length === 0 ? (
          <p>Sem dados.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Data</th>
                  <th align="left">Anilha</th>
                  <th align="left">Motivo</th>
                  <th align="right">Kg</th>
                  <th align="left">Notas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleString("pt-PT")}</td>
                    <td style={{ fontFamily: "monospace" }}>{r.ring_number}</td>
                    <td>{r.out_reason ?? ""}</td>
                    <td align="right">{Number(r.weight_kg ?? 0).toFixed(3)}</td>
                    <td style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.notes ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
