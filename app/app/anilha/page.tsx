"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  ring_number: string;
  entered_at: string | null;
  entry_weight_kg: number | null;
  status: string;
};

export default function AnilhaPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const { data, error } = await supabase
      .from("v_my_roosters_entry")
      .select("ring_number,entered_at,entry_weight_kg,status")
      .eq("status", "ACTIVE")
      .order("ring_number");

    if (error) setMsg(`Erro: ${error.message}`);
    else setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Anilhas (meu produtor)</h1>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Lista</h2>
          <button onClick={load}>Atualizar</button>
        </div>

        {rows.length === 0 ? (
          <p style={{ marginBottom: 0, marginTop: 12 }}>Sem anilhas ativas.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Data entrada</th>
                  <th align="left">Hora</th>
                  <th align="left">Anilha</th>
                  <th align="right">Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const d = r.entered_at ? new Date(r.entered_at) : null;
                  const date = d ? d.toLocaleDateString("pt-PT") : "";
                  const time = d ? d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <tr key={r.ring_number} style={{ borderTop: "1px solid #eee" }}>
                      <td>{date}</td>
                      <td>{time}</td>
                      <td style={{ fontFamily: "monospace" }}>{r.ring_number}</td>
                      <td align="right">{Number(r.entry_weight_kg ?? 0).toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
