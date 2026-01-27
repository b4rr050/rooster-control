"use client";

import { useMemo, useState } from "react";

export default function GeneratorClient() {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [count, setCount] = useState<number>(50);

  const [rings, setRings] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textBlock = useMemo(() => rings.join("\n"), [rings]);

  async function generate() {
    setMsg(null);
    setRings([]);
    setLoading(true);

    const res = await fetch("/api/admin/generate-rings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, count }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(`Erro: ${json.error ?? "falhou"}`);
      return;
    }

    setRings(json.rings ?? []);
    setMsg(`Geradas ${json.rings?.length ?? 0} anilhas.`);
  }

  async function copy() {
    if (!textBlock) return;
    await navigator.clipboard.writeText(textBlock);
    setMsg("Copiado para a área de transferência.");
  }

  return (
    <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Ano</div>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Mês (1..12)</div>
            <input
              type="number"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              style={{ width: "100%" }}
              min={1}
              max={12}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Quantidade</div>
            <input
              type="number"
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              style={{ width: "100%" }}
              min={1}
              max={5000}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={generate} disabled={loading}>
            {loading ? "A gerar..." : "Gerar"}
          </button>
          <button onClick={copy} disabled={!rings.length}>
            Copiar
          </button>
        </div>

        {msg && <p style={{ margin: 0 }}>{msg}</p>}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Resultado</div>
        <textarea
          value={textBlock}
          readOnly
          rows={12}
          style={{ width: "100%", fontFamily: "monospace" }}
          placeholder="As anilhas geradas aparecem aqui…"
        />
      </div>
    </section>
  );
}
