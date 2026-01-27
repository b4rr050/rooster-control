import Link from "next/link";
import { getProfile } from "@/lib/getProfile";
import LogoutButton from "./components/LogoutButton";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        textDecoration: "none",
        border: "1px solid #e5e5e5",
      }}
    >
      {label}
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfile();

  const displayUser = profile?.name ?? user?.email ?? "—";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #eaeaea",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700 }}>Gestão Galos</div>

            <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <NavLink href="/app" label="Dashboard" />
              <NavLink href="/app/entrada" label="Entrada" />
              <NavLink href="/app/saida" label="Saída" />
              <NavLink href="/app/transferencia" label="Transferências" />
              <NavLink href="/app/anilha" label="Anilhas" />
              <NavLink href="/app/historico-saidas" label="Histórico Saídas" />
              <NavLink href="/app/perfil" label="Perfil" />
              {profile?.role === "ADMIN" && <NavLink href="/app/anilhas" label="Gerar Anilhas" />}
              {profile?.role === "ADMIN" && <NavLink href="/app/admin/historico-saidas" label="Hist. Saídas (Admin)" />}
              {profile?.role === "ADMIN" && <NavLink href="/app/admin" label="Admin" />}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{displayUser}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{profile?.role ?? ""}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>{children}</main>
    </div>
  );
}
