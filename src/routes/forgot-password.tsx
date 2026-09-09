/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email) {
      setError("Informe seu e-mail.");
      return;
    }

    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    setError("");

    // TODO: enviar solicitação para a API
    setShowSuccessModal(true);
  }

  return (
    <>
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Esqueci minha senha
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Informe o e-mail associado à sua conta para receber as instruções
              para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  aria-invalid={!!error}
                />

                {error ? (
                  <FieldError>{error}</FieldError>
                ) : (
                  <FieldDescription>
                    Enviaremos um link para redefinir sua senha.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>

            <Button type="submit" className="mt-6 w-full">
              Enviar
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

      {showSuccessModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
            <h2
              id="success-modal-title"
              className="text-xl font-semibold tracking-tight"
            >
              E-mail enviado!
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Verifique sua caixa de entrada ou a pasta de spam para receber
              mais informações sobre como redefinir sua senha.
            </p>

            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Entendi
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
