import Link from "next/link";
import { getProfile } from "@/lib/getProfile";

export default async function Nav() {
  const { profile } = await getProfile();
  const role = profile?.role;

  const isAdmin = role === "ADMIN";

  const links = [
    { href: "/app", label: "Dashboard", show: true },
    { href: "/app/saida", label: "Saídas", show: true },
    { href: "/app/transferencia", label: "Transferências", show: true },
    { href: "/app/anilha", label: "Anilhas", show: true },
    { href: "/app/perfil", label: "Perfil", show: true },

    // ADMIN only
    { href: "/app/entrada", label: "Entrada", show: isAdmin },
    { href: "/app/admin", label: "Admin", show: isAdmin },
  ].filter(l => l.show);

  return (
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
