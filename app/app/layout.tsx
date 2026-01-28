import "../globals.css";
import { getProfile } from "@/lib/getProfile";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfile();

  if (!user) {
    // middleware já deve redirecionar, mas fica seguro
    return <div style={{ padding: 20 }}>Não autenticado.</div>;
  }

  const role = profile?.role ?? "PRODUCER";
  const name = profile?.name ?? user.email ?? "Utilizador";

  return (
    <div className="shell">
      <Sidebar role={role} />
      <div className="main">
        <Topbar name={name} role={role} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
