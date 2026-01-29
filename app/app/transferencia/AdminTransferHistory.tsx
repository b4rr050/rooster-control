"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  date: string;
  ring_number: string;
  transfer_reason: string | null;
  weight_kg: number | null;
  from_producer: { name: string | null } | null;
  to_producer: { name: string | null } | null;
};

export default function AdminTransferHistory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/transfer-history?limit=200");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(json.error ?? "Erro ao carregar");
    setRows(json.rows ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Transferências (Admin)</h2>
        <button type="button" onClick={load}>Atualizar</button>
      </div>

      {msg && <p className="error">{msg}</p>}

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Data/Hora</th>
              <th align="left">Anilha</th>
              <th align="left">Origem</th>
              <th align="left">Destino</th>
              <th align="left">Motivo</th>
              <th align="right">Kg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleString("pt-PT")}</td>
                <td style={{ fontFamily: "monospace" }}>{r.ring_number}</td>
                <td>{r.from_producer?.name ?? ""}</td>
                <td>{r.to_producer?.name ?? ""}</td>
                <td>{r.transfer_reason ?? ""}</td>
                <td align="right">{Number(r.weight_kg ?? 0).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
