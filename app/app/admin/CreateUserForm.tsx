"use client";

import { useState } from "react";

export default function CreateUserForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    nif: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setTempPassword(null);
    setLoading(true);

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(`Erro: ${json.error ?? "falhou"}`);
      return;
    }

    setMsg("Utilizador criado com sucesso.");
    setTempPassword(json.tempPassword ?? null);
    setForm({ name: "", email: "", phone: "", address: "", nif: "" });
  }

  async function copyPassword() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setMsg("Password copiada.");
  }

  return (
    <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h2>Criar utilizador (Produtor)</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
        <input
          placeholder="Nome do produtor"
          value={form.name}
          onChange={e => setField("name", e.target.value)}
          required
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setField("email", e.target.value)}
          required
        />
        <input
          placeholder="Telemóvel"
          value={form.phone}
          onChange={e => setField("phone", e.target.value)}
        />
        <input
          placeholder="Morada"
          value={form.address}
          onChange={e => setField("address", e.target.value)}
        />
        <input
          placeholder="NIF (9 dígitos)"
          value={form.nif}
          onChange={e => setField("nif", e.target.value)}
        />

        <button disabled={loading}>{loading ? "A criar..." : "Criar"}</button>
      </form>

      {tempPassword && (
        <div style={{ marginTop: 14, padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <b>Password temporária (copiar e enviar ao produtor):</b>
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ fontSize: 16 }}>{tempPassword}</code>
            <button onClick={copyPassword}>Copiar</button>
          </div>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            (Mostra uma vez. Se perderes, usa “Reset password” na lista.)
          </p>
        </div>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </section>
  );
}
