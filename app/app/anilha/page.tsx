export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getProfile } from "@/lib/getProfile";
import AnilhaClient from "./AnilhaClient";

export default async function AnilhaPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile) return <p>Perfil não encontrado.</p>;

  return <AnilhaClient role={profile.role} producerId={profile.producer_id ?? null} />;
}
