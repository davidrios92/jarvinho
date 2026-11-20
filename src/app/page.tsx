import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function SignedInAs() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  return <CardDescription>Sesión iniciada como {email}</CardDescription>;
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Jarvinho</CardTitle>
          <Suspense fallback={<CardDescription>…</CardDescription>}>
            <SignedInAs />
          </Suspense>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button className="w-full" disabled>
            Chat (próximo paso)
          </Button>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
