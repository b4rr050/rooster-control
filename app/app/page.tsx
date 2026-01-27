import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/getProfile";
import { createAdminClient } from "@/lib/supabase/admin";

type MoveRow = {
  id: string;
  date: string;
  type: string;
  ring_number: string;
  weight_kg: number | null;
  out_reason: string | null;
  transfer_reason: string | null;
  from_producer_id: string | null;
  to_producer_id: string | null;
  from_producer?: { name: string | null } | null;
  to_producer?: { name: string | null } | null;
};

function actorProducerName(m: MoveRow) {
  // quem registou / mais legível:
  // IN -> destino; OUT -> origem; TRANSFER -> origem -> destino
  if (m.type === "IN") return m.to_producer?.name ?? m.to_producer_id ?? "";
  return m.from_producer?.name ?? m.from_producer_id ?? "";
}

export default async function Dashboard() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado/ativo.</p>;

  // Stock do produtor (ou global se admin via trigger/RLS, mas aqui deixamos simples)
  const supabase = await createClient();
  const { data: stockRows } = await supabase
    .from("roosters")
    .select("ring_number")
    .eq("status", "ACTIVE");

  const stock = stockRows?.length ?? 0;

  // ADMIN: mostrar últimos movimentos IN/OUT/TRANSFER com produtor
  let moves: MoveRow[] = [];
  if (profile.role === "ADMIN") {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("movements")
      .select(
        `
        id,date,type,ring_number,weight_kg,out_reason,transfer_reason,from_producer_id,to_producer_id,
        from_producer:from_producer_id(name),
        to_producer:to_producer_id(name)
        `
      )
      .order("date", { ascending: false })
      .limit(25);

    if (!error) moves = (data ?? []) as any;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Dashboard</h1>
        <p style={{ margin: 0 }}><b>Utilizador:</b> {profile.name ?? user.email}</p>
        <p style={{ margin: 0 }}><b>Perfil:</b> {profile.role}</p>
        <p style={{ margin: 0 }}><b>Stock atual:</b> {stock}</p>
      </div>

      {profile.role === "ADMIN" && (
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Últimos movimentos</h2>

          {moves.length === 0 ? (
            <p>Sem movimentos.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th align="left">Data/Hora</th>
                    <th align="left">Produtor</th>
                    <th align="left">Tipo</th>
                    <th align="left">Anilha</th>
                    <th align="left">Motivo</th>
                    <th align="right">Kg</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.map(m => {
                    const motivo =
                      m.type === "OUT"
                        ? (m.out_reason ?? "")
                        : m.type === "TRANSFER"
                          ? (m.transfer_reason ?? "")
                          : "";
                    return (
                      <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ whiteSpace: "nowrap" }}>{new Date(m.date).toLocaleString("pt-PT")}</td>
                        <td>{actorProducerName(m)}</td>
                        <td>{m.type}</td>
                        <td style={{ fontFamily: "monospace" }}>{m.ring_number}</td>
                        <td>{motivo}</td>
                        <td align="right">{Number(m.weight_kg ?? 0).toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
