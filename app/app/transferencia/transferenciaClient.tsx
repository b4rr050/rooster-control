"use client";

import { useMemo, useState, useTransition } from "react";
import { transferRoosterAction } from "@/lib/actions/movements";

type Producer = { id: string; name: string | null };
type Props = {
  role: "ADMIN" | "PRODUCER";
  producers: Producer[];
};

export default function TransferenciaClient({ role, producers }: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const options = useMemo(() => producers ?? [], [producers]);

  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-medium mb-3">Transferir anilha</h2>

      <form
        action={(fd) => {
          setMsg(null);
          startTransition(async () => {
            const res = await transferRoosterAction(fd);
            setMsg(res.ok ? "Transferência registada com sucesso." : res.error ?? "Erro ao transferir.");
          });
        }}
        className="grid gap-3 md:grid-cols-4"
      >
        <div className="md:col-span-1">
          <label className="text-xs opacity-70">Anilha</label>
          <input
            name="ring_number"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="ex: PT-000123"
            required
          />
        </div>

        <div className="md:col-span-1">
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
          <input name="reason" className="w-full rounded-lg border px-3 py-2" placeholder="ex: troca / venda" required />
        </div>

        <div className="md:col-span-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">
            {pending ? "A transferir..." : "Confirmar transferência"}
          </button>

          <span className="text-xs opacity-70">
            {role === "PRODUCER" ? "Apenas anilhas do seu produtor." : "Admin: pode transferir qualquer anilha."}
          </span>
        </div>
      </form>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
