"use client";

import { useState, useTransition } from "react";
import { exitRoosterAction } from "@/lib/actions/movements";

type Props = {
  role: "ADMIN" | "PRODUCER";
};

const OUT_REASONS = ["ABATE", "VENDA", "MORTE", "PERDA", "OUTRO"] as const;

export default function SaidaClient({ role }: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-medium mb-3">Dar saída</h2>

      <form
        action={(fd) => {
          setMsg(null);
          startTransition(async () => {
            const res = await exitRoosterAction(fd);
            setMsg(res.ok ? "Saída registada com sucesso." : res.error ?? "Erro ao registar saída.");
          });
        }}
        className="grid gap-3 md:grid-cols-6"
      >
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">Anilha</label>
          <input name="ring_number" className="w-full rounded-lg border px-3 py-2" placeholder="ex: PT-000123" required />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs opacity-70">Motivo</label>
          <select name="out_reason" className="w-full rounded-lg border px-3 py-2" required defaultValue="VENDA">
            {OUT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs opacity-70">Peso (kg)</label>
          <input name="weight_kg" className="w-full rounded-lg border px-3 py-2" placeholder="opcional" inputMode="decimal" />
        </div>

        <div className="md:col-span-6">
          <label className="text-xs opacity-70">Notas</label>
          <input name="notes" className="w-full rounded-lg border px-3 py-2" placeholder="opcional" />
        </div>

        <div className="md:col-span-6 flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">
            {pending ? "A registar..." : "Confirmar saída"}
          </button>

          <span className="text-xs opacity-70">
            {role === "PRODUCER" ? "Apenas anilhas do seu produtor." : "Admin: pode registar qualquer saída."}
          </span>
        </div>
      </form>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
