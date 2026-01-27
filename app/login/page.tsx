import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Entrar</h1>

      <form action={loginAction} style={{ display: "grid", gap: 12 }}>
        <input name="email" placeholder="Email" />
        <input name="password" placeholder="Password" type="password" />
        <button type="submit">Entrar</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </main>
  );
}
