import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

import { login } from "./login";
import { getRoleHomePath } from "./role-routes";
import { type LoginFormValues, loginSchema } from "./schema";

const GENERIC_LOGIN_ERROR = "E-mail ou senha incorretos";

const fieldClassName = "h-12 px-4 py-3 text-lg md:text-lg";

const linkClassName = cn(
  "text-lg font-medium text-foreground underline underline-offset-4",
  "hover:text-foreground/90 focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
);

export function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      void router.navigate({ href: getRoleHomePath(session.user_type) });
    },
    onError: (error) => {
      if (error instanceof ApiError && applyLoginFieldErrors(error, setError)) {
        setAuthError(null);
        return;
      }

      setAuthError(GENERIC_LOGIN_ERROR);
    },
  });

  const isSubmitting = loginMutation.isPending;

  function onSubmit(values: LoginFormValues) {
    if (loginMutation.isPending) {
      return;
    }

    setAuthError(null);
    clearErrors();
    loginMutation.mutate(values);
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border px-6 py-6 sm:px-12 lg:px-16">
        <p className="text-xl font-semibold tracking-tight sm:text-2xl">
          <span className="text-foreground">Seniors</span>{" "}
          <span className="font-normal text-muted-foreground">
            Empregabilidade
          </span>
        </p>
      </header>

      <main className="flex flex-1 justify-center px-6 pt-10 pb-16 sm:px-12 sm:pt-14 lg:px-16 lg:pt-16">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
            Entrar
          </h1>

          <form
            className="mt-10 space-y-7"
            noValidate
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
          >
            {authError ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-lg text-destructive"
              >
                {authError}
              </p>
            ) : null}

            <div className="space-y-3">
              <Label htmlFor="email">Usuário (e-mail)</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={fieldClassName}
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email ? (
                <p id="email-error" className="text-base text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3">
              <Label htmlFor="password" className="col-start-1 row-start-1">
                Senha
              </Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={cn("col-span-2 row-start-2", fieldClassName)}
                disabled={isSubmitting}
                {...register("password")}
              />
              <button
                type="button"
                className={cn(linkClassName, "col-start-2 row-start-1")}
                aria-controls="password"
                aria-pressed={showPassword}
                disabled={isSubmitting}
                onClick={() => {
                  setShowPassword((current) => !current);
                }}
              >
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </button>
              {errors.password ? (
                <p
                  id="password-error"
                  className="col-span-2 text-base text-destructive"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg"
              disabled={!isValid || isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 aria-hidden className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <a
            href="/forgot-password"
            className={cn(linkClassName, "mt-5 inline-block")}
          >
            Esqueci minha senha
          </a>

          <Separator className="my-10" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg text-foreground">Não tenho uma conta</p>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => {
                void router.navigate({ href: "/users/register" });
              }}
            >
              Criar conta
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

const LOGIN_FIELDS = ["email", "password"] as const;

function applyLoginFieldErrors(
  error: ApiError,
  setError: UseFormSetError<LoginFormValues>,
): boolean {
  if (!error.errors) {
    return false;
  }

  let applied = false;

  for (const field of LOGIN_FIELDS) {
    const message = joinFieldMessages(error.errors[field]);

    if (message) {
      setError(field, { type: "server", message });
      applied = true;
    }
  }

  return applied;
}

function joinFieldMessages(messages: string[] | undefined): string | undefined {
  const visibleMessages = messages?.filter(
    (message) => message.trim().length > 0,
  );

  if (!visibleMessages || visibleMessages.length === 0) {
    return undefined;
  }

  return visibleMessages.join(" ");
}
