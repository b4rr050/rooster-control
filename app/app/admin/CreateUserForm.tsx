"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Producer = { id: string; name: string | null };

export default function CreateUserForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nif, setNif] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<"PRODUCER" | "ADMIN">("PRODUCER");
  const [producerId, setProducerId] = useState<string>("");

  const [producers, setProducers] = useState<Producer[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProducers() {
    const { data, error } = await supabase.rpc("list_active_producers");
    if (!error) setProducers((data ?? []) as any);
  }

  useEffect(() => {
    loadProducers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setMsg(null);

    if (!name.trim()) return setMsg("Nome obrigatório");
    if (!email.trim()) return setMsg("Email obrigatório");
    if (!password.trim()) return setMsg("Password obrigatória");
    if (role === "PRODUCER" && !producerId) return setMsg("Escolhe um produtor");

    setLoading(true);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        address,
        nif,
        password,
        role,
        producer_id: role === "PRODUCER" ? producerId : null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) return setMsg(json.error ?? "Erro ao criar utilizador");

    setMsg("OK: utilizador criado.");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNif("");
    setPassword("");
    setRole("PRODUCER");
    setProducerId("");
  }

  return (
    <section className="card" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Nome
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </label>

        <label>
          Telefone
          <input value={phone} onChange={e => setPhone(e.target.value)} />
        </label>

        <label>
          Morada
          <input value={address} onChange={e => setAddress(e.target.value)} />
        </label>

        <label>
          NIF
          <input value={nif} onChange={e => setNif(e.target.value)} />
        </label>

        <label>
          Password inicial
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </label>

        <label>
          Role
          <select value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="PRODUCER">PRODUCER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        {role === "PRODUCER" && (
          <label>
            Produtor associado
            <select value={producerId} onChange={e => setProducerId(e.target.value)}>
              <option value="">— escolher —</option>
              {producers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <button type="button" onClick={submit} disabled={loading}>
        {loading ? "A criar..." : "Criar utilizador"}
      </button>

      {msg && <p className={msg.startsWith("OK") ? "muted" : "error"}>{msg}</p>}
    </section>
  );
}
