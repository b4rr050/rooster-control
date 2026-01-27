"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Producer = { id: string; name: string };

export default function TransferenciaPage() {
  const supabase = createClient();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [toProducerId, setToProducerId] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("producers").select("id,name").eq("is_active", true).then(({ data }) => {
      setProducers(data ?? []);
    });
  }, []);

  async function submit() {
    setMsg(null);
    if (!toProducerId) return setMsg("Escolhe o produtor destino.");

    const rings = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!rings.length) return setMsg("Sem anilhas.");

    const payload = rings.map(ring_number => ({
      type: "TRANSFER",
      ring_number,
      to_producer_id: toProducerId,
      date: new Date().toISOString(),
    }));

    const { error } = await supabase.from("movements").insert(payload);
    if (error) setMsg(`Erro: ${error.message}`);
    else setMsg(`OK: ${rings.length} transferências registadas.`);
  }

  return (
    <main>
      <h1>Transferência</h1>

      <label>Transferir para:</label>
      <select value={toProducerId} onChange={e => setToProducerId(e.target.value)}>
        <option value="">-- escolher --</option>
        {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <p style={{ marginTop: 12 }}>Cole 1 anilha por linha.</p>
      <textarea rows={10} style={{ width: "100%" }} value={text} onChange={e => setText(e.target.value)} />

      <button onClick={submit} style={{ marginTop: 12 }}>Registar</button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
