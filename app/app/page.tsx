import { getProfile } from "@/lib/getProfile";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  // stock atual (roosters ativos do produtor; admin vê total global)
  let stock = 0;

  if (profile.role === "ADMIN") {
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

  // últimos movimentos (admin: global; produtor: apenas dele)
  let movements: any[] = [];

  if (profile.role === "ADMIN") {
    const { data } = await supabase
      .from("movements")
      .select("id,type,ring_number,date,out_reason,transfer_reason,weight_kg,from_producer_id,to_producer_id")
      .order("date", { ascending: false })
      .limit(20);

    movements = data ?? [];
  } else {
    const { data } = await supabase
      .from("movements")
      .select("id,type,ring_number,date,out_reason,transfer_reason,weight_kg,from_producer_id,to_producer_id")
      .or(`from_producer_id.eq.${profile.producer_id},to_producer_id.eq.${profile.producer_id}`)
      .order("date", { ascending: false })
      .limit(20);

    movements = data ?? [];
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Dashboard</h1>

      <section className="card">
        <div style={{ display: "grid", gap: 6 }}>
          <div>
            Utilizador: <b>{profile.role === "ADMIN" ? "Administrador" : "Produtor"}</b>
          </div>
          <div>
            Perfil: <b>{profile.role}</b>
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
            <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Data/Hora</th>
                  <th align="left">Tipo</th>
                  <th align="left">Anilha</th>
                  <th align="left">Motivo</th>
                  <th align="right">Kg</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(m.date).toLocaleString("pt-PT")}</td>
                    <td>{m.type}</td>
                    <td style={{ fontFamily: "monospace" }}>{m.ring_number}</td>
                    <td>{m.out_reason ?? m.transfer_reason ?? ""}</td>
                    <td align="right">{Number(m.weight_kg ?? 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {profile.role === "ADMIN" && (
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
