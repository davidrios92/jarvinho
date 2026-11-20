"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCode, verifyCode, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  // Cambiar la key remonta el formulario y vuelve al paso del email.
  const [attempt, setAttempt] = useState(0);
  return (
    <LoginSteps
      key={attempt}
      initialError={attempt === 0 ? initialError : undefined}
      onRestart={() => setAttempt((n) => n + 1)}
    />
  );
}

function LoginSteps({
  initialError,
  onRestart,
}: {
  initialError?: string;
  onRestart: () => void;
}) {
  const [emailState, emailAction, sending] = useActionState<LoginState, FormData>(sendCode, {
    step: "email",
    error: initialError,
  });
  const [codeState, codeAction, verifying] = useActionState<LoginState, FormData>(verifyCode, {
    step: "email",
  });

  if (emailState.step !== "code") {
    return (
      <form action={emailAction} className="flex flex-col gap-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
        />
        {emailState.error && <p className="text-sm text-destructive">{emailState.error}</p>}
        <Button type="submit" disabled={sending}>
          {sending ? "Enviando…" : "Enviarme el código"}
        </Button>
      </form>
    );
  }

  const codeError = codeState.step === "code" ? codeState.error : undefined;

  return (
    <form action={codeAction} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Si {emailState.email} está autorizado, te llegó un email. Escribí el código acá o tocá el
        link (en el iPhone usá el código para que la sesión quede en la app instalada).
      </p>
      <input type="hidden" name="email" value={emailState.email} />
      <Label htmlFor="token">Código</Label>
      <Input
        id="token"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,10}"
        required
        autoFocus
      />
      {codeError && <p className="text-sm text-destructive">{codeError}</p>}
      <Button type="submit" disabled={verifying}>
        {verifying ? "Verificando…" : "Entrar"}
      </Button>
      <Button type="button" variant="ghost" onClick={onRestart}>
        Usar otro email
      </Button>
    </form>
  );
}
