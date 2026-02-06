export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getProfile } from "@/lib/getProfile";
import { createClient } from "@/lib/supabase/server";

type Movement = {
  id: string;
  type: "IN" | "OUT" | "TRANSFER";
  ring_number: string;
  date: string;
  out_reason: string | null;
  transfer_reason: string | null;
  weight_kg: number | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

export default async function DashboardPage() {
  const { user, profile } = await getProfile();

  if (!user) {
    return (
      <main>
        <h1>Não autenticado</h1>
        <p>Por favor faz login primeiro.</p>
        <Link href="/login">Ir para login</Link>
      </main>
    );
  }

  if (!profile) {
    return (
      <main>
        <h1>Perfil não encontrado</h1>
        <p>O utilizador existe, mas não tem perfil ativo no sistema.</p>
      </main>
    );
  }

  const role = profile.role;
  const supabase = await createClient();

  // Stock
  let stock = 0;

  if (role === "ADMIN") {
    const { count } = await supabase
      .from("roosters")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE");
    stock = count ?? 0;
  } else {
    const { count } = await supabase
      .from("roosters")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .eq("current_producer_id", profile.producer_id);
    stock = count ?? 0;
  }

  // Movimentos
  let movements: Movement[] = [];

  if (role === "ADMIN") {
    const { data } = await supabase
      .from("movements")
      .select(
        "id,type,ring_number,date,out_reason,transfer_reason,weight_kg,from_producer_id,to_producer_id"
      )
      .order("date", { ascending: false })
      .limit(30);

    movements = (data ?? []) as any;
  } else {
    const { data } = await supabase
      .from("movements")
      .select(
        "id,type,ring_number,date,out_reason,transfer_reason,weight_kg,from_producer_id,to_producer_id"
      )
      .or(
        `from_producer_id.eq.${profile.producer_id},to_producer_id.eq.${profile.producer_id}`
      )
      .order("date", { ascending: false })
      .limit(30);

    movements = (data ?? []) as any;
  }

  // Admin: buscar nomes de produtores envolvidos para mostrar na tabela
  let producerNameById: Record<string, string> = {};

  if (role === "ADMIN") {
    const ids = Array.from(
      new Set(
        movements
          .flatMap(m => [m.from_producer_id, m.to_producer_id])
          .filter(Boolean) as string[]
      )
    );

    if (ids.length > 0) {
      const { data: ps } = await supabase
        .from("producers")
        .select("id,name")
        .in("id", ids);

      (ps ?? []).forEach(p => {
        producerNameById[p.id] = p.name ?? p.id;
      });
    }
  }

  const roleLabel = role === "ADMIN" ? "Administrador" : "Produtor";

  function reasonLabel(m: Movement) {
    if (m.type === "OUT") return m.out_reason ?? "";
    if (m.type === "TRANSFER") return m.transfer_reason ?? "";
    return "";
  }

  function producerLabel(m: Movement) {
    if (role !== "ADMIN") return "";

    if (m.type === "IN") return producerNameById[m.to_producer_id ?? ""] ?? "";
    if (m.type === "OUT") return producerNameById[m.from_producer_id ?? ""] ?? "";
    if (m.type === "TRANSFER") {
      const a = producerNameById[m.from_producer_id ?? ""] ?? "";
      const b = producerNameById[m.to_producer_id ?? ""] ?? "";
      return a && b ? `${a} → ${b}` : a || b;
    }
    return "";
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Dashboard</h1>

      <section className="card">
        <div style={{ display: "grid", gap: 6 }}>
          <div>
            Perfil: <b>{role}</b>{" "}
            <span style={{ opacity: 0.7 }}>({roleLabel})</span>
          </div>
          <div>
            Stock atual: <b>{stock}</b>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Últimos movimentos</h2>

        {movements.length === 0 ? (
          <p style={{ opacity: 0.8, marginBottom: 0 }}>Sem movimentos.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              cellPadding={10}
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th align="left">Data/Hora</th>
                  <th align="left">Tipo</th>
                  {role === "ADMIN" && <th align="left">Produtor</th>}
                  <th align="left">Anilha</th>
                  <th align="left">Motivo</th>
                  <th align="right">Kg</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(m.date).toLocaleString("pt-PT")}
                    </td>
                    <td>{m.type}</td>
                    {role === "ADMIN" && <td>{producerLabel(m)}</td>}
                    <td style={{ fontFamily: "monospace" }}>{m.ring_number}</td>
                    <td>{reasonLabel(m)}</td>
                    <td align="right">{Number(m.weight_kg ?? 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {role === "ADMIN" && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Atalhos Admin</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/app/admin">
              <button type="button">Administração</button>
            </Link>
            <Link href="/app/entrada">
              <button type="button">Entrada</button>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
