export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProfile } from "@/lib/getProfile";
import Link from "next/link";
import UsersTableClient from "./UsersTableClient";

export default async function AdminPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  if (profile.role !== "ADMIN") {
    return (
      <main>
        <h1>Administração</h1>
        <p>Sem permissões.</p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1>Administração</h1>

        <Link href="/app/admin/create-user">
          <button type="button">Adicionar utilizador</button>
        </Link>
      </div>

      <UsersTableClient />
    </main>
  );
}
