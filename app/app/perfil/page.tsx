"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  name: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
};

export default function PerfilPage() {
  const supabase = createClient();

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({
    name: "",
    phone: "",
    address: "",
    nif: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // password
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setMsg("Não autenticado.");
      return;
    }
    setEmail(userData.user.email ?? "");

    const { data, error } = await supabase
      .from("profiles")
      .select("name, phone, address, nif")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      setMsg(`Erro: ${error.message}`);
      return;
    }

    setProfile({
      name: data?.name ?? "",
      phone: (data as any)?.phone ?? "",
      address: (data as any)?.address ?? "",
      nif: (data as any)?.nif ?? "",
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setMsg(null);
    setSaving(true);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setSaving(false);
      setMsg("Não autenticado.");
      return;
    }

    const payload = {
      name: profile.name?.trim() || null,
      phone: profile.phone?.trim() || null,
      address: profile.address?.trim() || null,
      nif: profile.nif?.trim() || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", userData.user.id);

    setSaving(false);

    if (error) return setMsg(`Erro: ${error.message}`);

    setMsg("Guardado com sucesso.");
  }

  async function changePassword() {
    setPwMsg(null);

    if (pw1.length < 6) return setPwMsg("A password deve ter pelo menos 6 caracteres.");
    if (pw1 !== pw2) return setPwMsg("As passwords não coincidem.");

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwSaving(false);

    if (error) return setPwMsg(`Erro: ${error.message}`);

    setPw1("");
    setPw2("");
    setPwMsg("Password atualizada com sucesso.");
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>Perfil</h1>

      {/* Dados */}
      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16, maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Os meus dados</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Email (não editável)</div>
            <input value={email} readOnly style={{ width: "100%", opacity: 0.8 }} />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nome</div>
            <input
              value={profile.name ?? ""}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Telemóvel</div>
            <input
              value={profile.phone ?? ""}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Morada</div>
            <input
              value={profile.address ?? ""}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>NIF</div>
            <input
              value={profile.nif ?? ""}
              onChange={e => setProfile(p => ({ ...p, nif: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveProfile} disabled={saving}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </button>
            <button onClick={load} disabled={saving}>
              Recarregar
            </button>
          </div>

          {msg && <p style={{ margin: 0, color: msg.startsWith("Erro") ? "crimson" : "inherit" }}>{msg}</p>}
        </div>
      </section>

      {/* Password */}
      <section style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16, maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Alterar password</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nova password</div>
            <input
              type="password"
              value={pw1}
              onChange={e => setPw1(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Confirmar password</div>
            <input
              type="password"
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={changePassword} disabled={pwSaving}>
              {pwSaving ? "A atualizar..." : "Atualizar password"}
            </button>
          </div>

          {pwMsg && <p style={{ margin: 0, color: pwMsg.startsWith("Erro") ? "crimson" : "inherit" }}>{pwMsg}</p>}
        </div>
      </section>
    </main>
  );
}
