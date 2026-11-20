import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Todo menos estáticos, íconos y archivos de la PWA.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
