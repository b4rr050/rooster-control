import LogoutButton from "app/components/LogoutButton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header
        style={{
          padding: 12,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>Rooster Control</strong>
        <LogoutButton />
      </header>

      <main style={{ padding: 20 }}>{children}</main>
    </>
  );
}
