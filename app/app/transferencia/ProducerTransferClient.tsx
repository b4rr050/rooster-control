"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProducerTransferHistory from "./ProducerTransferHistory";

type RoosterRow = { ring_number: string };
type Producer = { id: string; name: string | null };

type TransferRow = {
  ring_number: string;
  to_producer_id: string;
  reason: "VENDA" | "TROCA" | "OUTRO";
  weight_kg: string; // opcional (para futuro, já fica)
};

const REASONS: TransferRow["reason"][] = ["VENDA", "TROCA", "OUTRO"];

export default function ProducerTransferClient() {
  const supabase = createClient();

  const [rings, setRings] = useState<RoosterRow[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<TransferRow[]>([]);

  // defaults (para novas linhas e também para "aplicar a todas")
  const [defaultProducerId, setDefaultProducerId] = useState("");
  const [defaultReason, setDefaultReason] = useState<TransferRow["reason"]>("VENDA");
  const [defaultWeight, setDefaultWeight] = useState<string>("");

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

  // sincronizar rows com seleção (robusto)
  useEffect(() => {
    setRows(prev => {
      const byRing = new Map(prev.map(r => [r.ring_number, r]));
      return selectedList.map(ring => {
        const existing = byRing.get(ring);
        if (existing) return existing;
        return {
          ring_number: ring,
          to_producer_id: defaultProducerId,
          reason: defaultReason,
          weight_kg: defaultWeight,
        };
      });
    });
  }, [selectedList, defaultProducerId, defaultReason, defaultWeight]);

  function setRowProducer(ring: string, to_producer_id: string) {
    setRows(prev => prev.map(r => (r.ring_number === ring ? { ...r, to_producer_id } : r)));
  }

  function setRowReason(ring: string, reason: TransferRow["reason"]) {
    setRows(prev => prev.map(r => (r.ring_number === ring ? { ...r, reason } : r)));
  }

  function setRowWeight(ring: string, weight_kg: string) {
    setRows(prev => prev.map(r => (r.ring_number === ring ? { ...r, weight_kg } : r)));
  }

  function removeRow(ring: string) {
    setSelected(prev => ({ ...prev, [ring]: false }));
  }

  function applyProducerToAll() {
    if (!defaultProducerId) return;
    setRows(prev => prev.map(r => ({ ...r, to_producer_id: defaultProducerId })));
  }

  function applyReasonToAll() {
    setRows(prev => prev.map(r => ({ ...r, reason: defaultReason })));
  }

  function applyWeightToAll() {
    setRows(prev => prev.map(r => ({ ...r, weight_kg: defaultWeight })));
  }

  function validate(): { ok: true; items: any[] } | { ok: false; error: string } {
    if (rows.length === 0) return { ok: false, error: "Seleciona pelo menos 1 anilha." };

    for (const r of rows) {
      if (!r.to_producer_id) return { ok: false, error: `Falta destino na anilha ${r.ring_number}` };
      if (!REASONS.includes(r.reason)) return { ok: false, error: "Motivo inválido." };

      // peso é opcional (se preencher, validar)
      if (r.weight_kg?.trim()) {
        const w = Number(r.weight_kg.replace(",", "."));
        if (!Number.isFinite(w) || w <= 0) {
          return { ok: false, error: `Peso inválido na anilha ${r.ring_number}` };
        }
      }
    }

    return {
      ok: true,
      items: rows.map(r => ({
        ring_number: r.ring_number,
        to_producer_id: r.to_producer_id,
        reason: r.reason,
        // enviar null se vazio
        weight_kg: r.weight_kg?.trim() ? Number(r.weight_kg.replace(",", ".")) : null,
      })),
    };
  }

  async function submit() {
    setMsg(null);
    const v = validate();
    if (!v.ok) return setMsg(v.error);

    setLoading(true);

    // Se a tua RPC atual ainda não aceita weight, ignoramos aqui.
    // Vamos enviar apenas ring_number/to_producer_id/reason para não rebentar.
    const itemsNoWeight = v.items.map(({ weight_kg, ...rest }) => rest);

    const { data, error } = await supabase.rpc("transfer_roosters_detailed", {
      p_items: itemsNoWeight,
      p_notes: notes.trim() ? notes.trim() : null,
    });

    setLoading(false);

    if (error) return setMsg(`Erro: ${error.message}`);

    setMsg(`OK: Transferidas ${data} anilhas.`);
    clearAll();
    await loadRings();
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Transferências</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>
        Seleciona as tuas anilhas e define <b>destino</b> + <b>motivo</b> (peso opcional).
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
          <h2 style={{ margin: 0 }}>Transferência (por anilha)</h2>

          {rows.length > 0 && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Destino p/ todas</span>
                <select value={defaultProducerId} onChange={e => setDefaultProducerId(e.target.value)}>
                  <option value="">— escolher —</option>
                  {producers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name ?? p.id}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={applyProducerToAll} disabled={!defaultProducerId}>
                  Aplicar
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Motivo p/ todas</span>
                <select value={defaultReason} onChange={e => setDefaultReason(e.target.value as any)}>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button type="button" onClick={applyReasonToAll}>Aplicar</button>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Peso p/ todas</span>
                <input
                  value={defaultWeight}
                  onChange={e => setDefaultWeight(e.target.value)}
                  placeholder="ex: 3.450"
                  inputMode="decimal"
                  style={{ width: 120 }}
                />
                <button type="button" onClick={applyWeightToAll}>Aplicar</button>
              </div>
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
                  <th align="left">Destino</th>
                  <th align="left">Motivo</th>
                  <th align="left">Peso (opcional)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.ring_number}>
                    <td style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.ring_number}</td>

                    <td>
                      <select value={r.to_producer_id} onChange={e => setRowProducer(r.ring_number, e.target.value)}>
                        <option value="">— escolher —</option>
                        {producers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name ?? p.id}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select value={r.reason} onChange={e => setRowReason(r.ring_number, e.target.value as any)}>
                        {REASONS.map(x => (
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
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Notas (opcional)</div>
                <input value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%" }} />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={submit} disabled={loading}>
                  {loading ? "A registar..." : "Confirmar transferência"}
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
      <ProducerTransferHistory limit={25} />

    </main>
  );
}
