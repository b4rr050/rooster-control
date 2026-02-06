"use client";

import { useMemo, useState, useTransition } from "react";
import { transferRoosterAction, transferRoostersBulkAction } from "@/lib/actions/movements";

type Producer = { id: string; name: string | null };
type Props = {
  role: "ADMIN" | "PRODUCER";
  producers: Producer[];
};

const TRANSFER_REASONS = ["VENDA", "TROCA", "OUTRO"] as const;

export default function TransferenciaClient({ role, producers }: Props) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"ONE" | "BULK">("ONE");

  const [msg, setMsg] = useState<string | null>(null);
  const [bulkReport, setBulkReport] = useState<{
    total: number;
    ok: number;
    failed: number;
    results: { ring_number: string; ok: boolean; error?: string }[];
  } | null>(null);

  const options = useMemo(() => producers ?? [], [producers]);

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">Transferir</h2>

        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("ONE");
              setMsg(null);
              setBulkReport(null);
            }}
            className={`rounded-lg border px-3 py-1 ${mode === "ONE" ? "opacity-100" : "opacity-60"}`}
          >
            Nominal
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("BULK");
              setMsg(null);
              setBulkReport(null);
            }}
            className={`rounded-lg border px-3 py-1 ${mode === "BULK" ? "opacity-100" : "opacity-60"}`}
          >
            Lote
          </button>
        </div>
      </div>

      {mode === "ONE" ? (
        <form
          action={(fd) => {
            setMsg(null);
            setBulkReport(null);
            startTransition(async () => {
              const res = await transferRoosterAction(fd);
              setMsg(res.ok ? "Transferência registada com sucesso." : res.error ?? "Erro ao transferir.");
            });
          }}
          className="grid gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-2">
            <label className="text-xs opacity-70">Anilha</label>
            <input name="ring_number" className="w-full rounded-lg border px-3 py-2" placeholder="ex: PT-000123" required />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs opacity-70">Destino</label>
            <select name="to_producer_id" className="w-full rounded-lg border px-3 py-2" required defaultValue="">
              <option value="" disabled>
                Selecionar...
              </option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs opacity-70">Motivo</label>
            <select name="transfer_reason" className="w-full rounded-lg border px-3 py-2" required defaultValue="VENDA">
              {TRANSFER_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="text-xs opacity-70">Notas</label>
            <input name="notes" className="w-full rounded-lg border px-3 py-2" placeholder="opcional" />
          </div>

          <div className="md:col-span-6 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">
              {pending ? "A transferir..." : "Confirmar transferência"}
            </button>

            <span className="text-xs opacity-70">
              {role === "PRODUCER" ? "Apenas anilhas do seu produtor." : "Admin: pode transferir qualquer anilha."}
            </span>
          </div>
        </form>
      ) : (
        <form
          action={(fd) => {
            setMsg(null);
            setBulkReport(null);
            startTransition(async () => {
              const res = await transferRoostersBulkAction(fd);

              if (!res.ok) {
                setMsg((res as any).error ?? "Erro ao transferir em lote.");
                return;
              }

              setMsg(`Lote concluído: ${(res as any).summary.ok}/${(res as any).summary.total} OK.`);
              setBulkReport({
                total: (res as any).summary.total,
                ok: (res as any).summary.ok,
                failed: (res as any).summary.failed,
                results: (res as any).results,
              });
            });
          }}
          className="grid gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-6">
            <label className="text-xs opacity-70">Anilhas (uma por linha, ou separadas por vírgulas)</label>
            <textarea
              name="ring_numbers"
              className="w-full rounded-lg border px-3 py-2 min-h-[120px]"
              placeholder={"PT-000123\nPT-000124\nPT-000125"}
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs opacity-70">Destino</label>
            <select name="to_producer_id" className="w-full rounded-lg border px-3 py-2" required defaultValue="">
              <option value="" disabled>
                Selecionar...
              </option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs opacity-70">Motivo</label>
            <select name="transfer_reason" className="w-full rounded-lg border px-3 py-2" required defaultValue="VENDA">
              {TRANSFER_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="text-xs opacity-70">Notas</label>
            <input name="notes" className="w-full rounded-lg border px-3 py-2" placeholder="opcional" />
          </div>

          <div className="md:col-span-6 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">
              {pending ? "A transferir..." : "Confirmar lote"}
            </button>

            <span className="text-xs opacity-70">
              {role === "PRODUCER" ? "Só serão aceites anilhas do seu produtor (as outras falham)." : "Admin: pode transferir qualquer anilha."}
            </span>
          </div>

          {bulkReport && (
            <div className="md:col-span-6 rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">
                Relatório: {bulkReport.ok}/{bulkReport.total} OK · {bulkReport.failed} falhas
              </div>

              <div className="space-y-1 text-sm">
                {bulkReport.results.map((r) => (
                  <div key={r.ring_number} className="flex items-center justify-between gap-3">
                    <span className="font-medium">{r.ring_number}</span>
                    <span className={`text-xs ${r.ok ? "opacity-70" : "text-red-600"}`}>
                      {r.ok ? "OK" : r.error ?? "Falhou"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
