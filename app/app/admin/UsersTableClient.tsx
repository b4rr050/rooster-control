"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  producer_id: string | null;
  producers?: { name: string | null } | null;
};

export default function UsersTableClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const res = await fetch("/api/admin/users");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(json.error ?? "Erro ao carregar");
    setRows(json.rows ?? []);
  }

  async function toggleActive(user_id: string) {
    setMsg(null);
    const res = await fetch("/api/admin/toggle-active", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(json.error ?? "Erro");
    await load();
  }

  async function resetPassword(user_id: string) {
    setMsg(null);
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(json.error ?? "Erro");
    setMsg("OK: password reset enviada.");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Utilizadores</h2>
        <button type="button" onClick={load}>Atualizar</button>
      </div>

      {msg && <p className={msg.startsWith("OK") ? "muted" : "error"}>{msg}</p>}

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Email</th>
              <th align="left">Role</th>
              <th align="left">Produtor</th>
              <th align="left">Ativo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.email}</td>
                <td>{r.role}</td>
                <td>{r.producers?.name ?? ""}</td>
                <td>{r.is_active ? "Sim" : "Não"}</td>
                <td align="right" style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => toggleActive(r.id)}>
                    {r.is_active ? "Desativar" : "Ativar"}
                  </button>
                  <button type="button" onClick={() => resetPassword(r.id)}>
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
