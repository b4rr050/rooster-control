import { getProfile } from "@/lib/getProfile";
import AdminOutHistory from "./AdminOutHistory";
import ProducerSaidaClient from "./ProducerSaidaClient";

export default async function SaidaPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  if (profile.role === "ADMIN") {
    return (
      <main style={{ display: "grid", gap: 16 }}>
        <h1>Saída</h1>
        <p className="muted" style={{ margin: 0 }}>
          Aqui o administrador apenas consulta as saídas (motivo, peso e produtor).
        </p>
        <AdminOutHistory />
      </main>
    );
  }

  return <ProducerSaidaClient />;
}
