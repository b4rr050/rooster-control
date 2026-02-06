export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProfile } from "@/lib/getProfile";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  return <PerfilClient />;
}
