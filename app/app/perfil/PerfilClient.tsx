"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  email: string | null;
  role: "ADMIN" | "PRODUCER";
  is_active: boolean;
  producer_id: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  nif?: string | null;
};

export default function PerfilClient() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nif, setNif] = useState("");

  async function load() {
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setMsg("Não autenticado.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,email,role,is_active,producer_id,name,phone,address,nif")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setMsg("Perfil não encontrado.");
      return;
    }

    setProfile(data as any);
    setName((data as any).name ?? "");
    setPhone((data as any).phone ?? "");
    setAddress((data as any).address ?? "");
    setNif((data as any).nif ?? "");
  }

  async function save() {
    setMsg(null);
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        nif: nif.trim() || null,
      })
      .eq("user_id", profile.user_id);

    if (error) return setMsg("Erro: " + error.message);
    setMsg("OK: dados atualizados.");
    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ display: "grid", gap: 16, maxWidth: 520 }}>
      <h1>Perfil</h1>

      {msg && <p className={msg.startsWith("OK") ? "muted" : "error"}>{msg}</p>}

      {!profile ? (
        <p className="muted">A carregar…</p>
      ) : (
        <>
          <section className="card" style={{ display: "grid", gap: 10 }}>
            <div className="muted">
              <b>{profile.role}</b> • {profile.email}
            </div>

            <label>
              Nome
              <input value={name} onChange={e => setName(e.target.value)} />
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

            <button type="button" onClick={save}>
              Guardar
            </button>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Password</h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Para já, o reset é feito pelo Administrador na página Administração.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
