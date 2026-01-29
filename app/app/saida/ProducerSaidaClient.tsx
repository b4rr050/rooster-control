"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import OutHistoryList from "./OutHistoryList";

type RoosterRow = { ring_number: string };

type ExitRow = {
  ring_number: string;
  reason: "ABATE" | "VENDA" | "MORTE" | "PERDA" | "OUTRO";
  weight_kg: string; // input
};

const OUT_REASONS: ExitRow["reason"][] = ["ABATE", "VENDA", "MORTE", "PERDA", "OUTRO"];

export default function ProducerSaidaClient() {
  const supabase = createClient();

  const [rings, setRings] = useState<RoosterRow[]>([]);
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<ExitRow[]>([]);

  const [bulkReason, setBulkReason] = useState<ExitRow["reason"]>("ABATE");
  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadRings() {
    setMsg(null);
    const { data, error } = await supabase
      .from("roosters")
      .select("ring_number")
      .eq("status", "ACTIVE")
      .order("ring_number")
      .limit(5000);

    if (error) setMsg(`Erro: ${error.message}`);
    else setRings((data ?? []) as any);
  }

  useEffect(() => {
    loadRings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rings;
    return rings.filter(r => r.ring_number.toLowerCase().includes(q));
  }, [rings, query]);

  const selectedList = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  function toggle(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: !prev[ring] }));
  }

  function clearAll() {
    setSelected({});
    setRows([]);
    setNotes("");
  }

  function selectFirst(n: number) {
    const next: Record<string, boolean> = {};
    filtered.slice(0, n).forEach(r => (next[r.ring_number] = true));
    setSelected(next);
  }

  // sincronizar rows com seleção
  useEffect(() => {
    setRows(prev => {
      const byRing = new Map(prev.map(r => [r.ring_number, r]));
      return selectedList.map(ring => {
        const existing = byRing.get(ring);
        return (
          existing ?? {
            ring_number: ring,
            reason: "ABATE",
            weight_kg: "",
          }
        );
      });
    });
  }, [selectedList]);

  function setRowReason(ring: string, reason: ExitRow["reason"]) {
    setRows(prev => prev.map(r => (r.ring_number === ring ? { ...r, reason } : r)));
  }

  function setRowWeight(ring: string, weight_kg: string) {
    setRows(prev => prev.map(r => (r.ring_number === ring ? { ...r, weight_kg } : r)));
  }

  function removeRow(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: false }));
  }

  function applyReasonToAll() {
    setRows(prev => prev.map(r => ({ ...r, reason: bulkReason })));
  }

  const totals = useMemo(() => {
    const count = rows.length;
    let kg = 0;
    let filled = 0;

    for (const r of rows) {
      const w = Number((r.weight_kg ?? "").replace(",", "."));
      if (Number.isFinite(w) && w > 0) {
        kg += w;
        filled += 1;
      }
    }
    return { count, kg, filled };
  }, [rows]);

  function validate(): { ok: true; items: any[] } | { ok: false; error: string } {
    if (rows.length === 0) return { ok: false, error: "Seleciona pelo menos 1 anilha." };

    const items = rows.map(r => ({
      ring_number: r.ring_number,
      reason: r.reason,
      weight_kg: Number((r.weight_kg ?? "").replace(",", ".")),
    }));

    for (const it of items) {
      if (!it.ring_number) return { ok: false, error: "Anilha inválida." };
      if (!OUT_REASONS.includes(it.reason)) return { ok: false, error: "Motivo inválido." };

      if (!Number.isFinite(it.weight_kg) || it.weight_kg <= 0) {
        return { ok: false, error: `Peso inválido na anilha ${it.ring_number} (ex: 3.450).` };
      }
    }

    return { ok: true, items };
  }

  async function submit() {
    setMsg(null);
    const v = validate();
    if (!v.ok) return setMsg(v.error);

    setLoading(true);
    const { data, error } = await supabase.rpc("exit_roosters_detailed", {
      p_items: v.items,
      p_notes: notes.trim() ? notes.trim() : null,
    });
    setLoading(false);

    if (error) return setMsg(`Erro: ${error.message}`);

    setMsg(`OK: Saída registada para ${data} anilhas.`);
    clearAll();
    await loadRings();
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Saída</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>
        Seleciona as tuas anilhas e preenche <b>motivo</b> + <b>peso</b> por anilha.
      </p>

      {/* Lista */}
      <section className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Anilhas ativas</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => selectFirst(10)}>Selecionar 10</button>
            <button type="button" onClick={() => selectFirst(50)}>Selecionar 50</button>

            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {filtered.length} visíveis • {selectedList.length} selecionadas
            </span>

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

      {/* Tabela */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Saída (por anilha)</h2>

          {rows.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Motivo p/ todas</span>
              <select value={bulkReason} onChange={e => setBulkReason(e.target.value as any)}>
                {OUT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button type="button" onClick={applyReasonToAll}>Aplicar</button>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.8 }}>
            Seleciona anilhas acima para aparecerem aqui.
          </p>
        ) : (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Anilha</th>
                  <th align="left">Motivo</th>
                  <th align="left">Peso (kg)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.ring_number}>
                    <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.ring_number}</td>
                    <td>
                      <select value={r.reason} onChange={e => setRowReason(r.ring_number, e.target.value as any)}>
                        {OUT_REASONS.map(x => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={r.weight_kg}
                        onChange={e => setRowWeight(r.ring_number, e.target.value)}
                        placeholder="ex: 3.450"
                        inputMode="decimal"
                        style={{ width: 140 }}
                      />
                    </td>
                    <td align="right">
                      <button type="button" onClick={() => removeRow(r.ring_number)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                <b>Resumo:</b> {totals.count} anilhas • <b>{totals.kg.toFixed(3)} kg</b>{" "}
                <span style={{ opacity: 0.7 }}>({totals.filled}/{totals.count} pesos preenchidos)</span>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Notas (opcional)</div>
                <input value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%" }} />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={submit} disabled={loading}>
                  {loading ? "A registar..." : "Confirmar saída"}
                </button>
                <button type="button" onClick={clearAll} disabled={loading}>
                  Limpar tudo
                </button>
              </div>

              {msg && <p style={{ margin: 0, color: msg.startsWith("OK:") ? "inherit" : "crimson" }}>{msg}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Histórico do produtor (apenas do próprio) */}
      <OutHistoryList limit={25} />
    </main>
  );
}
