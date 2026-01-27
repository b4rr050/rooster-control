"use client";

import { useMemo, useState } from "react";

export default function UsersTableClient({
  profiles,
  producerNameByIdObj,
}: {
  profiles: any[];
  producerNameByIdObj: Record<string, string>;
}) {
  const producerNameById = useMemo(
    () => new Map(Object.entries(producerNameByIdObj)),
    [producerNameByIdObj]
  );

  const [msg, setMsg] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState<string | null>(null);

  async function toggleActive(user_id: string, is_active: boolean) {
    setMsg(null);
    setResetPwd(null);

    const res = await fetch("/api/admin/toggle-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, is_active: !is_active }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(`Erro: ${json.error ?? "falhou"}`);

    // refresh simples
    window.location.reload();
  }

  async function resetPassword(user_id: string) {
    setMsg(null);
    setResetPwd(null);

    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(`Erro: ${json.error ?? "falhou"}`);

    setResetPwd(json.tempPassword ?? null);
    setMsg("Password resetada.");
  }

  async function copy() {
    if (!resetPwd) return;
    await navigator.clipboard.writeText(resetPwd);
    setMsg("Password copiada.");
  }

  return (
    <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h2>Utilizadores</h2>

      {resetPwd && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <b>Nova password temporária:</b>
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ fontSize: 16 }}>{resetPwd}</code>
            <button onClick={copy}>Copiar</button>
          </div>
        </div>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Nome</th>
              <th align="left">Role</th>
              <th align="left">Produtor</th>
              <th align="left">Telemóvel</th>
              <th align="left">NIF</th>
              <th align="left">Ativo</th>
              <th align="left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.user_id} style={{ borderTop: "1px solid #eee" }}>
                <td>{p.name ?? ""}</td>
                <td>{p.role}</td>
                <td>{p.producer_id ? producerNameById.get(p.producer_id) ?? p.producer_id : "-"}</td>
                <td>{p.phone ?? "-"}</td>
                <td>{p.nif ?? "-"}</td>
                <td>{p.is_active ? "Sim" : "Não"}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.role === "PRODUCER" && (
                    <>
                      <button onClick={() => toggleActive(p.user_id, p.is_active)}>
                        {p.is_active ? "Desativar" : "Ativar"}
                      </button>
                      <button onClick={() => resetPassword(p.user_id)}>
                        Reset password
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={7}>Sem utilizadores.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
