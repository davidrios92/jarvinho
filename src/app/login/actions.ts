"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function appOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "");
}

export async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { step: "email", error: "Escribí un email válido." };
  }

  // Si el email no es el autorizado no se manda nada, pero la respuesta es la misma
  // para no revelar cuál es el email válido.
  if (isAllowedEmail(email)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${await appOrigin()}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error("signInWithOtp", error.message);
      return { step: "email", error: "No se pudo enviar el email. Probá de nuevo en un minuto." };
    }
  }

  return { step: "code", email };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  if (!isAllowedEmail(email)) {
    return { step: "code", email, error: "Código inválido o vencido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, error: "Código inválido o vencido." };
  }

  redirect("/");
}
