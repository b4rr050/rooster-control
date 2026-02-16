export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DebugAppHome() {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();

  // tenta também ler a sessão (opcional)
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

  return (
    <main style={{ padding: 20, display: "grid", gap: 12 }}>
      <h1>Debug Auth</h1>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div>
          <b>getUser()</b>: {userData.user ? "OK" : "NULL"}
        </div>
        {userErr && <pre style={{ whiteSpace: "pre-wrap" }}>{userErr.message}</pre>}
        <div style={{ fontFamily: "monospace" }}>
          user_id: {userData.user?.id ?? "(null)"} <br />
          email: {userData.user?.email ?? "(null)"}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div>
          <b>getSession()</b>: {sessionData.session ? "OK" : "NULL"}
        </div>
        {sessionErr && <pre style={{ whiteSpace: "pre-wrap" }}>{sessionErr.message}</pre>}
        <div style={{ fontFamily: "monospace" }}>
          session_user: {sessionData.session?.user?.id ?? "(null)"}
        </div>
      </div>

      {!userData.user && (
        <div className="card">
          <p>Sessão inválida. Volte a fazer login.</p>
          <Link href="/login">Ir para login</Link>
        </div>
      )}
    </main>
  );
}
