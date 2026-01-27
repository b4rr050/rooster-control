import CreateUserForm from "./CreateUserForm";
import UsersTableClient from "./UsersTableClient";
import { getProfile } from "@/lib/getProfile";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { user, profile } = await getProfile();
  if (!user) return <p>Não autenticado.</p>;
  if (!profile || profile.role !== "ADMIN") return <p>Sem permissões.</p>;

  const supabase = await createClient();

  const { data: producers } = await supabase
    .from("producers")
    .select("id,name")
    .order("name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,name,role,phone,address,nif,is_active,producer_id,created_at")
    .order("created_at", { ascending: false });

  const producerNameByIdObj = Object.fromEntries((producers ?? []).map(p => [p.id, p.name]));

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Admin</h1>
      <CreateUserForm />
      <UsersTableClient profiles={profiles ?? []} producerNameByIdObj={producerNameByIdObj} />
    </main>
  );
}
