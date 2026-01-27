import { getProfile } from "@/lib/getProfile";
import GeneratorClient from "./ui";

export default async function AnilhasAdminPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile || profile.role !== "ADMIN") return <p>Sem permissões.</p>;

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Anilhas (Gerar Lotes)</h1>
      <GeneratorClient />
    </main>
  );
}
