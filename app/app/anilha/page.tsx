"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AnilhaPage() {
  const supabase = createClient();
  const [ring, setRing] = useState("");
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    setErr(null);
    setData(null);

    const { data, error } = await supabase
      .from("movements")
      .select("type,date,weight_kg,out_reason,from_producer_id,to_producer_id,notes")
      .eq("ring_number", ring.trim())
      .order("date", { ascending: true });

    if (error) setErr(error.message);
    else setData(data ?? []);
  }

  return (
    <main>
      <h1>Pesquisa Anilha</h1>
      <input placeholder="Nº anilha" value={ring} onChange={e => setRing(e.target.value)} />
      <button onClick={search} style={{ marginLeft: 8 }}>Pesquisar</button>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {data && (
        <ul style={{ marginTop: 16 }}>
          {data.map((m, i) => (
            <li key={i}>
              <b>{m.type}</b> — {new Date(m.date).toLocaleString()}
              {m.type === "OUT" && <> — {m.out_reason} — {m.weight_kg} kg</>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
