"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Rooster = { ring_number: string };
type Producer = { id: string; name: string | null };

const REASONS = ["VENDA", "TROCA", "OUTRO"] as const;
type Reason = (typeof REASONS)[number];

export default function TransferenciaPage() {
  const supabase = createClient();

  const [rings, setRings] = useState<Rooster[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [toProducerId, setToProducerId] = useState<string>("");
  const [reason, setReason] = useState<Reason>("VENDA");
  const [notes, setNotes] = useState("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadRings() {
    const { data, error } = await supabase
      .from("roosters")
      .select("ring_number")
      .eq("status", "ACTIVE")
      .order("ring_number")
      .limit(5000);

    if (error) setMsg(`Erro: ${error.message}`);
    else setRings((data ?? []) as any);
  }

  async function loadProducers() {
    const { data, error } = await supabase.rpc("list_active_producers");
    if (error) setMsg(`Erro: ${error.message}`);
    else setProducers((data ?? []) as any);
  }

  useEffect(() => {
    loadRings();
    loadProducers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rings;
    return rings.filter(r => r.ring_number.toLowerCase().includes(q));
  }, [rings, query]);

  const selectedList = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  function toggle(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: !prev[ring] }));
  }

  function clear() {
    setSelected({});
  }

  function selectFirst(n: number) {
    const next: Record<string, boolean> = {};
    filtered.slice(0, n).forEach(r => (next[r.ring_number] = true));
    setSelected(next);
  }

  async function submit() {
    setMsg(null);
    if (!toProducerId) return setMsg("Escolhe o produtor de destino.");
    if (selectedList.length === 0) return setMsg("Seleciona pelo menos 1 anilha.");

    setLoading(true);
    const { data, error } = await supabase.rpc("transfer_roosters", {
      p_rings: selectedList,
      p_to_producer_id: toProducerId,
      p_reason: reason,
      p_notes: notes.trim() ? notes.trim() : null,
    });
    setLoading(false);

    if (error) return setMsg(`Erro: ${error.message}`);

    setMsg(`OK: Transferidas ${data} anilhas.`);
    setNotes("");
    clear();
    await loadRings();
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Transferências</h1>

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Dados da transferência</h2>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 2fr auto", alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Produtor destino</div>
            <select value={toProducerId} onChange={e => setToProducerId(e.target.value)} style={{ width: "100%" }}>
              <option value="">— escolher —</option>
              {producers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Motivo</div>
            <select value={reason} onChange={e => setReason(e.target.value as Reason)} style={{ width: "100%" }}>
              {REASONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Notas (opcional)</div>
            <input value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%" }} />
          </div>

          <button onClick={submit} disabled={loading}>
            {loading ? "A registar..." : `Transferir (${selectedList.length})`}
          </button>
        </div>

        {msg && <p style={{ marginBottom: 0, marginTop: 10 }}>{msg}</p>}
      </section>

      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Anilhas ativas no meu produtor</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => selectFirst(10)}>Selecionar 10</button>
            <button onClick={() => selectFirst(50)}>Selecionar 50</button>
            <button onClick={clear}>Limpar</button>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Pesquisar…"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ marginTop: 12 }}>Sem anilhas ativas.</p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {filtered.map(r => {
              const isSel = !!selected[r.ring_number];
              return (
                <button
                  key={r.ring_number}
                  onClick={() => toggle(r.ring_number)}
                  style={{
                    border: "1px solid #eee",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontFamily: "monospace",
                    background: isSel ? "#e9f5ff" : "#fcfcfc",
                  }}
                >
                  {r.ring_number}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
