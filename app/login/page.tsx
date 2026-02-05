import { loginAction } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Entrar</h1>

      {error && (
        <p
          style={{
            color: "crimson",
            background: "#fff",
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}

      <form action={loginAction} style={{ display: "grid", gap: 12 }}>
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
