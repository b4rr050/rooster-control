"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AnilhaClient({
  role,
  producerId,
}: {
  role: "ADMIN" | "PRODUCER";
  producerId: string | null;
}) {
  const supabase = createClient();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // aqui vais depois construir o histórico completo
    // por agora só garantimos que o build/deploy passa
    (async () => {
      const { data, error } = await supabase
        .from("roosters")
        .select("ring_number")
        .limit(1);

      if (error) setMsg("Erro: " + error.message);
      else setMsg(`OK: carregado (${role})`);
    })();
  }, [role, producerId]);

  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h1>Anilha</h1>
      <p className="muted" style={{ margin: 0 }}>
        {role === "ADMIN" ? "Admin" : "Produtor"} {producerId ? `(${producerId})` : ""}
      </p>
      {msg && <p style={{ margin: 0 }}>{msg}</p>}
    </main>
  );
}
