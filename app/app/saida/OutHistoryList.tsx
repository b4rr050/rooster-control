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
  from_producer_id: string | null;
};

async function getMyProducerId(supabase: ReturnType<typeof createClient>) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("producer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return (data?.producer_id as string | null) ?? null;
}

export default function OutHistoryList({ limit = 25 }: { limit?: number }) {
  const supabase = createClient();
  const [rows, setRows] = useState<MovementOut[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);

    const producerId = await getMyProducerId(supabase);
    if (!producerId) {
      setErr("Sem produtor associado ao utilizador.");
      setRows([]);
      return;
    }

    const { data, error } = await supabase
      .from("movements")
      .select("id,date,ring_number,out_reason,weight_kg,notes,from_producer_id")
      .eq("type", "OUT")
      .eq("from_producer_id", producerId)
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
    <section className="card">
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Últimas saídas</h2>
        <button type="button" onClick={load}>Atualizar</button>
      </div>

      {err && <p className="error">Erro: {err}</p>}

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
                <tr key={r.id}>
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
