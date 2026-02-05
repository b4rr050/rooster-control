"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Producer = { id: string; name: string | null };
type PoolRow = {
  ring_number: string;
  status: "AVAILABLE" | "USED";
  batch_year: number;
  batch_month: number;
  seq: number;
  created_at: string;
};

function nowYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function EntradaAdminClient() {
  const supabase = createClient();

  const ym = nowYearMonth();
  const [year, setYear] = useState<number>(ym.year);
  const [month, setMonth] = useState<number>(ym.month);

  const [count, setCount] = useState<number>(50);

  const [pool, setPool] = useState<PoolRow[]>([]);
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [producers, setProducers] = useState<Producer[]>([]);
  const [producerId, setProducerId] = useState<string>("");

  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProducers() {
    const { data, error } = await supabase.rpc("list_active_producers");
    if (!error) setProducers((data ?? []) as any);
  }

  async function loadPool() {
    setMsg(null);
    const res = await fetch(`/api/admin/ring-pool?year=${year}&month=${month}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(json.error ?? "Erro ao carregar pool");
    setPool(json.rows ?? []);
    setSelected({});
  }

  useEffect(() => {
    loadProducers();
    loadPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = pool.filter(p => p.status === "AVAILABLE");
    if (!q) return base;
    return base.filter(r => r.ring_number.toLowerCase().includes(q));
  }, [pool, query]);

  const selectedList = useMemo(() => {
    return Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  }, [selected]);

  function toggle(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: !prev[ring] }));
  }

  function selectFirst(n: number) {
    const next: Record<string, boolean> = {};
    filtered.slice(0, n).forEach(r => (next[r.ring_number] = true));
    setSelected(next);
  }

  async function generate() {
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/admin/generate-rings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year, month, count }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setMsg(json.error ?? "Erro ao gerar");
    setMsg("OK: anilhas geradas.");
    await loadPool();
  }

  async function assign() {
    setMsg(null);
    if (!producerId) return setMsg("Escolhe um produtor.");
    if (selectedList.length === 0) return setMsg("Seleciona pelo menos 1 anilha.");

    setLoading(true);
    const res = await fetch("/api/admin/assign-rings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rings: selectedList,
        producer_id: producerId,
        notes: notes.trim() ? notes.trim() : null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) return setMsg(json.error ?? "Erro ao associar");
    setMsg(`OK: associadas ${json.count ?? 0} anilhas.`);
    setNotes("");
    await loadPool();
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Entrada (Admin)</h1>
      <p className="muted" style={{ margin: 0 }}>
        Gera anilhas e associa-as a produtores (entrada no sistema).
      </p>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Gerar anilhas</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            Ano{" "}
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 110 }} />
          </label>

          <label>
            Mês{" "}
            <input type="number" value={month} onChange={e => setMonth(Number(e.target.value))} min={1} max={12} style={{ width: 80 }} />
          </label>

          <label>
            Quantidade{" "}
            <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={2000} style={{ width: 110 }} />
          </label>

          <button type="button" onClick={generate} disabled={loading}>
            {loading ? "A gerar..." : "Gerar"}
          </button>

          <button type="button" onClick={loadPool} disabled={loading}>
            Recarregar pool
          </button>
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Anilhas disponíveis ({year}.{month})</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => selectFirst(10)}>Selecionar 10</button>
            <button type="button" onClick={() => selectFirst(50)}>Selecionar 50</button>

            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {filtered.length} visíveis • {selectedList.length} selecionadas
            </span>

            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar…" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ marginTop: 12, opacity: 0.8 }}>
            Sem anilhas AVAILABLE neste mês (gera ou escolhe outro mês).
          </p>
        ) : (
          <div className="ringGrid">
            {filtered.map(r => {
              const isSel = !!selected[r.ring_number];
              return (
                <button
                  type="button"
                  key={r.ring_number}
                  onClick={() => toggle(r.ring_number)}
                  className={`ringChip ${isSel ? "ringChipSelected" : ""}`}
                >
                  {r.ring_number}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Associar anilhas a produtor</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label>
              Produtor{" "}
              <select value={producerId} onChange={e => setProducerId(e.target.value)}>
                <option value="">— escolher —</option>
                {producers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? p.id}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Selecionadas: <b>{selectedList.length}</b>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Notas (opcional)</div>
            <input value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={assign} disabled={loading}>
              {loading ? "A associar..." : "Associar (Entrada)"}
            </button>
          </div>

          {msg && <p style={{ margin: 0, color: msg.startsWith("OK:") ? "inherit" : "crimson" }}>{msg}</p>}
        </div>
      </section>
    </main>
  );
}
