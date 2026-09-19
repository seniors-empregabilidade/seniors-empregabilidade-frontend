import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { messageForApiError } from "./api-messages";
import { requestPasswordReset } from "./password-reset";
import {
  type PasswordResetRequestValues,
  passwordResetRequestSchema,
} from "./schema";

export function RequestPasswordResetPage() {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
  });

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_result, values) => {
      setRequestError(null);
      setSentTo(values.email);
    },
    onError: (error: unknown) => {
      setRequestError(messageForApiError(error));
    },
  });

  function onSubmit(values: PasswordResetRequestValues) {
    if (requestMutation.isPending) {
      return;
    }

    setRequestError(null);
    requestMutation.mutate(values);
  }

  const isSubmitting = requestMutation.isPending;
  const emailError = errors.email?.message ?? requestError;

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Esqueci minha senha
          </h1>

          <p className="mt-3 text-lg leading-7 text-foreground-2">
            Informe o e-mail associado à sua conta para receber o código de
            verificação e redefinir sua senha.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <FieldGroup>
            <Field data-invalid={emailError ? true : undefined}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>

              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={emailError ? true : undefined}
                disabled={isSubmitting}
                {...register("email")}
              />

              {emailError ? (
                <FieldError>{emailError}</FieldError>
              ) : (
                <FieldDescription>
                  Enviaremos um código para redefinir sua senha.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <Button
            ref={submitButtonRef}
            type="submit"
            className="mt-6 w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-base font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Voltar para o login
          </a>
        </div>
      </div>

      <Dialog
        open={sentTo !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSentTo(null);
          }
        }}
        onOpenChangeComplete={(open) => {
          if (!open) {
            submitButtonRef.current?.focus();
          }
        }}
      >
        <DialogContent showCloseButton={false} finalFocus={false}>
          <DialogHeader>
            {/* The API answers the same way for an address with no account, so
                this dialog must not imply the address is registered. */}
            <DialogTitle>E-mail enviado!</DialogTitle>
            <DialogDescription>
              Se houver uma conta com esse e-mail, você receberá um código de
              verificação. Verifique sua caixa de entrada ou a pasta de spam.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const email = sentTo ?? "";
                setSentTo(null);
                void router.navigate({
                  href: `/reset-password?email=${encodeURIComponent(email)}`,
                });
              }}
            >
              Inserir código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
