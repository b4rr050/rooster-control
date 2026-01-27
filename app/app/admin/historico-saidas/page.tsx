import { getProfile } from "@/lib/getProfile";
import AdminOutHistoryClient from "./ui";

export default async function AdminHistoricoSaidasPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile || profile.role !== "ADMIN") return <p>Sem permissões.</p>;

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Histórico de Saídas (Admin)</h1>
      <AdminOutHistoryClient />
    </main>
  );
}
