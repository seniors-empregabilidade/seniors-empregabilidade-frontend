/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const passwordRules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isPasswordValid) {
      setError("A senha não atende a todos os requisitos de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setError("");

    // TODO: enviar nova senha para a API
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

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Nova senha</FieldLabel>

              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua nova senha"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                aria-invalid={!!error}
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

            <Field data-invalid={!!error && !passwordsMatch}>
              <FieldLabel htmlFor="confirm-password">
                Confirmar nova senha
              </FieldLabel>

              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="Digite sua nova senha novamente"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                aria-invalid={!!error && !passwordsMatch}
              />
            </Field>

            {error ? <FieldError>{error}</FieldError> : null}
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
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Voltar para o início
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
