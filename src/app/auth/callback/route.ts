import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Destino del magic link (flujo PKCE): canjea el código por una sesión.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const home = new URL("/", request.url);
  const failed = new URL("/login?error=link", request.url);

  if (!code) return NextResponse.redirect(failed);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !isAllowedEmail(data.user?.email)) {
    if (!error) await supabase.auth.signOut();
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(home);
}
