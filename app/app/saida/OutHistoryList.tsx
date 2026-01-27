"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MovementOut = {
  id: string;
  date: string;
  ring_number: string;
  out_reason: string | null;
  weight_kg: number | null;
  notes: string | null;
};

export default function OutHistoryList({ limit = 25 }: { limit?: number }) {
  const supabase = createClient();
  const [rows, setRows] = useState<MovementOut[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("movements")
      .select("id,date,ring_number,out_reason,weight_kg,notes")
      .eq("type", "OUT")
      .order("date", { ascending: false })
      .limit(limit);

    if (error) setErr(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Últimas saídas</h2>
        <button onClick={load}>Atualizar</button>
      </div>

      {err && <p style={{ color: "crimson" }}>Erro: {err}</p>}

      {rows.length === 0 ? (
        <p style={{ marginBottom: 0, opacity: 0.8 }}>Sem saídas registadas.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
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
  );
}
