import Link from "next/link";

type Item = { href: string; label: string; adminOnly?: boolean };

export default function Sidebar({ role }: { role: string }) {
  const items: Item[] = [
    { href: "/app", label: "Dashboard" },
    { href: "/app/entrada", label: "Entrada" },
    { href: "/app/saida", label: "Saída" },
    { href: "/app/transferencia", label: "Transferências" },
    { href: "/app/anilha", label: "Anilhas" },
    { href: "/app/perfil", label: "Perfil" },

    // admin only
    { href: "/app/anilhas", label: "Gerar Anilhas", adminOnly: true },
    { href: "/app/admin/historico-saidas", label: "Histórico Saídas", adminOnly: true },
    { href: "/app/admin", label: "Administração", adminOnly: true },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <div className="brandDot" />
        <div>
          <div className="brandTitle">Gestão Galos</div>
          <div className="brandSub">{role === "ADMIN" ? "Admin" : "Produtor"}</div>
        </div>
      </div>

      <nav className="sidebarNav">
        {items
          .filter(i => !i.adminOnly || role === "ADMIN")
          .map(i => (
            <Link key={i.href} href={i.href} className="navItem">
              {i.label}
            </Link>
          ))}
      </nav>

      <div className="sidebarFooter">
        <div className="pill">{role}</div>
      </div>
    </aside>
  );
}
