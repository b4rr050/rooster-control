"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Producer = { id: string; name: string | null };

type Row = {
  id: string;
  date: string;
  ring_number: string;
  out_reason: string | null;
  weight_kg: number | null;
  notes: string | null;
  from_producer_id: string | null;
  producers: Producer | null; // vem do select producers:from_producer_id(...)
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminOutHistoryClient() {
  const supabase = createClient();

  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return toISODate(d);
  });
  const [to, setTo] = useState<string>(() => toISODate(new Date()));
  const [reason, setReason] = useState<string>("ALL");
  const [producerId, setProducerId] = useState<string>("ALL");

  const [producers, setProducers] = useState<Producer[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProducers() {
    // Admin consegue listar (assumindo RLS/admin). Se não conseguires, eu faço endpoint também.
    const { data, error } = await supabase.from("producers").select("id,name").order("name");
    if (!error) setProducers((data ?? []) as any);
  }

  async function load() {
    setMsg(null);
    setLoading(true);

    const qs = new URLSearchParams();
    qs.set("from", from);
    qs.set("to", to);
    qs.set("reason", reason);
    qs.set("producer_id", producerId);
    qs.set("limit", "300");

    const res = await fetch(`/api/admin/out-history?${qs.toString()}`);
    const json = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) return setMsg(`Erro: ${json.error ?? "falhou"}`);

    setRows(json.rows ?? []);
  }

  useEffect(() => {
    loadProducers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, reason, producerId]);

  const totalKg = rows.reduce((s, r) => s + Number(r.weight_kg ?? 0), 0);

  return (
    <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Filtros</h2>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr auto", alignItems: "end" }}>
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

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Produtor</div>
          <select value={producerId} onChange={e => setProducerId(e.target.value)} style={{ width: "100%" }}>
            <option value="ALL">Todos</option>
            {producers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.id}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={load} disabled={loading}>
            {loading ? "A carregar..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
        Registos: <b>{rows.length}</b> • Total kg: <b>{totalKg.toFixed(3)}</b>
      </div>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Data</th>
              <th align="left">Produtor</th>
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
                <td>{r.producers?.name ?? r.from_producer_id ?? ""}</td>
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
    </section>
  );
}
