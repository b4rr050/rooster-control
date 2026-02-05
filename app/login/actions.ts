"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? ""); // NÃO fazer trim

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Preenche email e password"));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msgLower = (error.message ?? "").toLowerCase();

    const friendly =
      msgLower.includes("invalid") ||
      msgLower.includes("credentials") ||
      msgLower.includes("login") ||
      msgLower.includes("password")
        ? "Email ou password incorretos"
        : "Erro de autenticação";

    redirect("/login?error=" + encodeURIComponent(friendly));
  }

  redirect("/app");
}
