// Acceso tipado a variables de entorno. Falla temprano si falta alguna.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisá .env.example.`);
  }
  return value;
}

// Las NEXT_PUBLIC_ deben leerse con process.env.X literal para que Next las inyecte en el cliente.
export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabasePublishableKey = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

/** Solo servidor. Único email autorizado a entrar a la PWA. */
export const allowedEmail = () =>
  required("ALLOWED_EMAIL", process.env.ALLOWED_EMAIL).trim().toLowerCase();

export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === allowedEmail();
}
