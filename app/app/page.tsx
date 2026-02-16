import { getProfile } from "@/lib/getProfile";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

type Movement = {
  id: string;
  type: "IN" | "OUT" | "TRANSFER";
  ring_number: string;
  date: string;
  weight_kg: number | null;
  out_reason: string | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
};

export default async function DashboardPage() {
  const { user, profile } = await getProfile();

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Sessão inválida</h1>
        <p>Volte a fazer login.</p>
        <a href="/login">Ir para login</a>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Perfil não encontrado</h1>
        <p>O utilizador existe, mas não tem perfil ativo no sistema.</p>
      </main>
    );
  }

  const supabase = await createClient();

  // últimos movimentos
  const { data: movements } = await supabase
    .from("movements")
    .select("*")
    .order("date", { ascending: false })
    .limit(10);

  // mapa de produtores (para ADMIN)
  let producerNameById: Record<string, string> = {};

  if (profile.role === "ADMIN") {
    const { data: producers } = await supabase
      .from("producers")
      .select("id,name");

    producerNameById =
      producers?.reduce((acc: any, p: any) => {
        acc[p.id] = p.name;
        return acc;
      }, {}) ?? {};
  }

  function producerLabel(m: Movement) {
    if (profile.role !== "ADMIN") return "";

    if (m.type === "IN") return producerNameById[m.to_producer_id ?? ""] ?? "";
    if (m.type === "OUT") return producerNameById[m.from_producer_id ?? ""] ?? "";
    if (m.type === "TRANSFER") {
      const from = producerNameById[m.from_producer_id ?? ""] ?? "";
      const to = producerNameById[m.to_producer_id ?? ""] ?? "";
      return `${from} → ${to}`;
    }

    return "";
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <section style={{ marginTop: 20 }}>
        <strong>Utilizador:</strong> {profile.name ?? user.email}
        <br />
        <strong>Perfil:</strong> {profile.role}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Últimos Movimentos</h2>

        {!movements?.length && <p>Sem movimentos registados.</p>}

        {movements?.length ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 16,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>Data</th>
                <th>Anilha</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Peso (kg)</th>
                {profile.role === "ADMIN" && <th>Produtor</th>}
              </tr>
            </thead>
            <tbody>
              {movements.map((m: Movement) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{new Date(m.date).toLocaleString()}</td>
                  <td>{m.ring_number}</td>
                  <td>{m.type}</td>
                  <td>{m.out_reason ?? "-"}</td>
                  <td>{m.weight_kg ?? "-"}</td>
                  {profile.role === "ADMIN" && (
                    <td>{producerLabel(m)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  );
}
