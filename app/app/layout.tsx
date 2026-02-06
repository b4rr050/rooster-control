import LogoutButton from "@/components/LogoutButton";
import Nav from "./Nav";
import { getProfile } from "@/lib/getProfile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getProfile();

  return (
    <>
      <header
        style={{
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid" }}>
          <strong>Rooster Control</strong>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {profile?.role === "ADMIN" ? "Administrador" : "Produtor"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Nav />
          <LogoutButton />
        </div>
      </header>

      <main style={{ padding: 20 }}>{children}</main>
    </>
  );
}
