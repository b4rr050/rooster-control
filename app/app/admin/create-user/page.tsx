import { getProfile } from "@/lib/getProfile";
import CreateUserForm from "../CreateUserForm";

export default async function CreateUserPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  if (profile.role !== "ADMIN") return <p>Sem permissões.</p>;

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Novo utilizador</h1>
      <CreateUserForm />
    </main>
  );
}
