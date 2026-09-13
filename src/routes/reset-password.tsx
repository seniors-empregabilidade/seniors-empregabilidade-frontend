/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
});

type ResetStatus = "form" | "invalid-link" | "success" | "submit-error";

const linkClassName =
  "text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline";

function ResetPasswordPage() {
  // `Route.useSearch()` resolves to `any` because `router.tsx` registers the
  // route tree as `AnyRoute`, so the search value is re-validated here to get
  // a concretely typed result instead of asserting past that gap.
  const { token } = resetPasswordSearchSchema.parse(Route.useSearch());

  const [status, setStatus] = useState<ResetStatus>(
    token && token !== "expired" ? "form" : "invalid-link",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const mismatchError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? "As senhas não coincidem."
      : "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // TODO: enviar a nova senha e o token para a API.
    // O sentinel "server-error" é temporário, só para exercitar o estado de
    // erro genérico enquanto a integração real não existe.
    if (token === "server-error") {
      setStatus("submit-error");
      return;
    }

    setStatus("success");
  }

  if (status === "invalid-link") {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Link inválido ou expirado
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esse link de redefinição de senha não é mais válido. Solicite um
            novo para continuar.
          </p>

          <a
            href="/forgot-password"
            className={cn(linkClassName, "mt-6 inline-block")}
          >
            Solicitar novo link
          </a>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Senha redefinida!
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sua senha foi alterada com sucesso. Você já pode entrar com a nova
            senha.
          </p>

          <a href="/login" className={cn(linkClassName, "mt-6 inline-block")}>
            Ir para o login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Redefinir senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Crie uma nova senha para acessar sua conta.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <FieldGroup>
            {status === "submit-error" ? (
              <FieldError>
                Não foi possível redefinir sua senha. Tente novamente em
                instantes.
              </FieldError>
            ) : null}

            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Nova senha</FieldLabel>

                <button
                  type="button"
                  className={linkClassName}
                  aria-controls="password"
                  aria-pressed={showPassword}
                  onClick={() => {
                    setShowPassword((current) => !current);
                  }}
                >
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>
              </div>

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua nova senha"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
            </Field>

            <div className="rounded-lg bg-muted p-4">
              <p className="mb-3 text-sm font-medium">Sua senha deve conter:</p>

              <ul className="space-y-2 text-sm">
                <PasswordRule
                  valid={passwordRules.minLength}
                  text="Pelo menos 8 caracteres"
                />
                <PasswordRule
                  valid={passwordRules.uppercase}
                  text="Pelo menos uma letra maiúscula"
                />
                <PasswordRule
                  valid={passwordRules.lowercase}
                  text="Pelo menos uma letra minúscula"
                />
                <PasswordRule
                  valid={passwordRules.number}
                  text="Pelo menos um número"
                />
                <PasswordRule
                  valid={passwordRules.special}
                  text="Pelo menos um caractere especial"
                />
              </ul>
            </div>

            <Field data-invalid={!!mismatchError}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="confirm-password">
                  Confirmar nova senha
                </FieldLabel>

                <button
                  type="button"
                  className={linkClassName}
                  aria-controls="confirm-password"
                  aria-pressed={showConfirmPassword}
                  onClick={() => {
                    setShowConfirmPassword((current) => !current);
                  }}
                >
                  {showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>
              </div>

              <Input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite sua nova senha novamente"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                }}
                aria-invalid={!!mismatchError}
              />

              {mismatchError ? <FieldError>{mismatchError}</FieldError> : null}
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={!isPasswordValid || !passwordsMatch}
          >
            Redefinir senha
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className={linkClassName}>
            Voltar para o login
          </a>
        </div>
      </div>
    </main>
  );
}

function PasswordRule({ valid, text }: { valid: boolean; text: string }) {
  return (
    <li className={valid ? "text-green-600" : "text-muted-foreground"}>
      <span className="mr-2">{valid ? "✓" : "○"}</span>
      {text}
    </li>
  );
}
