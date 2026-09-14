import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  isInvalidCodeError,
  isPasswordRejectedError,
  messageForApiError,
} from "./api-messages";
import { confirmPasswordReset } from "./password-reset";
import {
  type PasswordResetConfirmationValues,
  passwordResetConfirmationSchema,
  passwordRules,
} from "./schema";

const linkClassName =
  "text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline";

export function ResetPasswordPage({ email = "" }: { email?: string }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [codeExpired, setCodeExpired] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PasswordResetConfirmationValues>({
    resolver: zodResolver(passwordResetConfirmationSchema),
    defaultValues: { email, code: "", password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const confirmMutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      setSubmitError(null);
      setSucceeded(true);
    },
    onError: (error: unknown) => {
      // The code is only validated when the new password is submitted: Cognito
      // has no endpoint that checks it beforehand, so an expired code can only
      // surface here.
      if (isInvalidCodeError(error)) {
        setCodeExpired(true);
        return;
      }

      if (isPasswordRejectedError(error)) {
        setError("password", {
          type: "server",
          message: messageForApiError(error),
        });
        return;
      }

      setSubmitError(messageForApiError(error));
    },
  });

  function onSubmit(values: PasswordResetConfirmationValues) {
    if (confirmMutation.isPending) {
      return;
    }

    setSubmitError(null);
    confirmMutation.mutate(values);
  }

  if (codeExpired) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Código inválido ou expirado
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esse código de redefinição não é mais válido. Solicite um novo para
            continuar.
          </p>

          <a
            href="/forgot-password"
            className={cn(linkClassName, "mt-6 inline-block")}
          >
            Solicitar novo código
          </a>
        </div>
      </main>
    );
  }

  if (succeeded) {
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

  const isSubmitting = confirmMutation.isPending;

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Redefinir senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Informe o código que enviamos por e-mail e crie uma nova senha.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <FieldGroup>
            {submitError ? (
              <FieldError role="alert">{submitError}</FieldError>
            ) : null}

            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={errors.email ? true : undefined}
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={errors.code ? true : undefined}>
              <FieldLabel htmlFor="code">Código de verificação</FieldLabel>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Código recebido por e-mail"
                aria-invalid={errors.code ? true : undefined}
                disabled={isSubmitting}
                {...register("code")}
              />
              {errors.code ? (
                <FieldError>{errors.code.message}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={errors.password ? true : undefined}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Nova senha</FieldLabel>

                <button
                  type="button"
                  className={linkClassName}
                  aria-controls="password"
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowPassword((current) => !current);
                  }}
                >
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>
              </div>

              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua nova senha"
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                disabled={isSubmitting}
                {...register("password")}
              />

              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : null}
            </Field>

            <div className="rounded-lg bg-muted p-4">
              <p className="mb-3 text-sm font-medium">Sua senha deve conter:</p>

              <ul className="space-y-2 text-sm">
                {passwordRules.map((rule) => {
                  const valid = rule.isMet(password);

                  return (
                    <li
                      key={rule.id}
                      className={
                        valid ? "text-green-600" : "text-muted-foreground"
                      }
                    >
                      <span className="mr-2">{valid ? "✓" : "○"}</span>
                      {rule.text}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Field data-invalid={errors.confirmPassword ? true : undefined}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="confirm-password">
                  Confirmar nova senha
                </FieldLabel>

                <button
                  type="button"
                  className={linkClassName}
                  aria-controls="confirm-password"
                  aria-pressed={showConfirmPassword}
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowConfirmPassword((current) => !current);
                  }}
                >
                  {showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                </button>
              </div>

              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite sua nova senha novamente"
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? true : undefined}
                disabled={isSubmitting}
                {...register("confirmPassword")}
              />

              {errors.confirmPassword ? (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir senha"
            )}
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
