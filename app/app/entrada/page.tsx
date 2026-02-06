export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProfile } from "@/lib/getProfile";
import EntradaAdminClient from "./EntradaAdminClient";

export default async function EntradaPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  if (profile.role !== "ADMIN") {
    return (
      <main>
        <h1>Entrada</h1>
        <p>Sem permissões.</p>
      </main>
    );
  }

  return <EntradaAdminClient />;
}
