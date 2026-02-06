export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProfile } from "@/lib/getProfile";
import AdminTransferHistory from "./AdminTransferHistory";
import ProducerTransferClient from "./ProducerTransferClient";

export default async function TransferenciaPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  if (profile.role === "ADMIN") {
    return (
      <main style={{ display: "grid", gap: 16 }}>
        <h1>Transferências</h1>
        <p className="muted" style={{ margin: 0 }}>
          O administrador apenas consulta o histórico global (origem, destino, motivo).
        </p>
        <AdminTransferHistory />
      </main>
    );
  }

  return <ProducerTransferClient />;
}
