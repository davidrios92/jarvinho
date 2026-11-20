import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar · Jarvinho" };

const ERRORS: Record<string, string> = {
  link: "No se pudo entrar con el link: vence, se usa una sola vez y solo sirve en el mismo navegador donde lo pediste (en el iPhone, el link abre Safari y no la app). Pedí un código nuevo y escribilo acá.",
};

async function LoginWithParams({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const initialError = typeof error === "string" ? ERRORS[error] : undefined;
  return <LoginForm initialError={initialError} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Jarvinho</CardTitle>
          <CardDescription>Entrá con tu email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginForm />}>
            <LoginWithParams {...props} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
