"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RingRow = {
  ring_number: string;
  seq: number;
};

export default function EntradaPage() {
  const supabase = createClient();

  const [rings, setRings] = useState<RingRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // mês atual (Lisboa) no frontend só para filtrar UI
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    // produtores só vêem AVAILABLE do mês atual
    supabase
      .from("ring_pool")
      .select("ring_number,seq")
      .eq("status", "AVAILABLE")
      .eq("batch_year", year)
      .eq("batch_month", month)
      .order("seq")
      .limit(500)
      .then(({ data, error }) => {
        if (error) setMsg(`Erro: ${error.message}`);
        else setRings((data ?? []) as any);
      });
  }, [year, month]);

  const selectedList = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  function toggle(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: !prev[ring] }));
  }

  function selectFirst(n: number) {
    const next: Record<string, boolean> = {};
    rings.slice(0, n).forEach(r => (next[r.ring_number] = true));
    setSelected(next);
  }

  function clear() {
    setSelected({});
  }

  async function submit() {
    setMsg(null);
    if (selectedList.length === 0) return setMsg("Seleciona pelo menos 1 anilha.");

    setLoading(true);

    // Chama RPC que valida mês atual em Lisboa + disponibilidade + existência no pool
    const { data, error } = await supabase.rpc("assign_rings_current_month", {
      p_rings: selectedList,
    });

    setLoading(false);

    if (error) return setMsg(`Erro: ${error.message}`);

    setMsg(`OK: Entrada registada para ${data} anilhas.`);
    // refresh lista
    setSelected({});
    const { data: refreshed } = await supabase
      .from("ring_pool")
      .select("ring_number,seq")
      .eq("status", "AVAILABLE")
      .eq("batch_year", year)
      .eq("batch_month", month)
      .order("seq")
      .limit(500);

    setRings((refreshed ?? []) as any);
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Entrada (mês atual)</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>
        Disponíveis: <b>{year}.{month}</b> — se não estiver aqui, assumimos que <b>não existe</b>.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => selectFirst(10)}>Selecionar 10</button>
        <button onClick={() => selectFirst(50)}>Selecionar 50</button>
        <button onClick={clear}>Limpar</button>
        <button onClick={submit} disabled={loading}>
          {loading ? "A registar..." : `Dar entrada (${selectedList.length})`}
        </button>
      </div>

      {msg && <p style={{ margin: 0 }}>{msg}</p>}

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Anilhas disponíveis</h2>

        {rings.length === 0 ? (
          <p>Sem anilhas disponíveis neste mês.</p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {rings.map(r => (
              <button
                key={r.ring_number}
                onClick={() => toggle(r.ring_number)}
                style={{
                  border: "1px solid #eee",
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontFamily: "monospace",
                  background: selected[r.ring_number] ? "#e9f5ff" : "#fcfcfc",
                }}
              >
                {r.ring_number}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
