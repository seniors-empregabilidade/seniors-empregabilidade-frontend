import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { confirmCompanyEmail, resendCompanyCode } from "./company-api";
import { registrationErrorMessage } from "./registration-errors";

export function EmailConfirmation({
  email,
  onConfirmed,
}: {
  email: string;
  onConfirmed?: () => void;
}) {
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const confirmationMessage = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (confirmed) confirmationMessage.current?.focus();
  }, [confirmed]);
  const confirmation = useMutation({
    mutationFn: () => confirmCompanyEmail(email, code),
    retry: false,
    gcTime: 0,
    onSuccess: () => {
      setCode("");
      setConfirmed(true);
      onConfirmed?.();
    },
  });
  const resend = useMutation({
    mutationFn: () => resendCompanyCode(email),
    retry: false,
    gcTime: 0,
  });
  if (confirmed)
    return (
      <p ref={confirmationMessage} tabIndex={-1} role="status">
        E-mail confirmado. A aprovação da empresa é uma etapa separada.
      </p>
    );
  return (
    <section
      aria-labelledby="email-confirmation-heading"
      className="space-y-4 rounded-xl border border-border p-6"
    >
      <h2 id="email-confirmation-heading" className="text-2xl font-semibold">
        Confirme seu e-mail
      </h2>
      <p>Digite o código enviado para seu e-mail corporativo.</p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim() && !confirmation.isPending && !resend.isPending)
            confirmation.mutate();
        }}
      >
        <Label htmlFor="confirmation-code">Código de confirmação</Label>
        <Input
          id="confirmation-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="one-time-code"
          maxLength={2048}
          required
          aria-invalid={confirmation.isError}
          aria-describedby={
            confirmation.isError ? "confirmation-error" : undefined
          }
        />
        {confirmation.isError && (
          <p id="confirmation-error" role="alert" className="text-destructive">
            {registrationErrorMessage(confirmation.error)}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          <Button
            type="submit"
            disabled={
              confirmation.isPending || resend.isPending || !code.trim()
            }
          >
            {confirmation.isPending ? "Confirmando…" : "Confirmar e-mail"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={resend.isPending || confirmation.isPending}
            onClick={() => resend.mutate()}
          >
            {resend.isPending ? "Enviando…" : "Reenviar código"}
          </Button>
        </div>
        {resend.isSuccess && (
          <p role="status">
            Se houver uma confirmação pendente, um novo código será enviado.
          </p>
        )}
        {resend.isError && (
          <p role="alert" className="text-destructive">
            {registrationErrorMessage(resend.error)}
          </p>
        )}
      </form>
    </section>
  );
}
