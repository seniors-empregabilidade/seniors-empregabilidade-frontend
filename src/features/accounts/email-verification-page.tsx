import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearPendingEmail,
  readPendingEmail,
  writePendingEmail,
} from "@/lib/pending-email";
import {
  codeRequestSchema,
  confirmEmail,
  emailRequestSchema,
  emailSchema,
  maskEmail,
  sendVerificationEmail,
  verificationError,
  type VerificationValues,
} from "./email-verification";

const focusClass = "focus-visible:ring-ring focus-visible:ring-offset-2";
const sentMessage =
  "Se este e-mail estiver cadastrado e precisar de verificação, enviaremos um código. Confira também a pasta de spam.";

function initialContext() {
  const stored = readPendingEmail();
  const parsed = emailSchema.safeParse(stored?.email);
  if (!stored || !parsed.success) return null;
  return {
    email: parsed.data,
    resendAvailableAt: Math.min(stored.resendAvailableAt, Date.now() + 60_000),
  };
}

export function EmailVerificationPage() {
  const [pending, setPending] = useState(initialContext);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState<{
    message: string;
    focus: "summary" | "email" | "code";
  } | null>(null);
  const [remaining, setRemaining] = useState(() =>
    Math.max(
      0,
      Math.ceil(((pending?.resendAvailableAt ?? 0) - Date.now()) / 1000),
    ),
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: { email: "" },
    reValidateMode: "onBlur",
  });
  const codeForm = useForm<{ code: string }>({
    resolver: zodResolver(codeRequestSchema),
    defaultValues: { code: "" },
    reValidateMode: "onBlur",
  });
  const { errors: emailErrors } = emailForm.formState;
  const { errors: codeErrors } = codeForm.formState;
  const { setFocus: focusEmail } = emailForm;
  const { setFocus: focusCode } = codeForm;
  const pendingEmail = pending?.email;
  const deadline = pending?.resendAvailableAt ?? 0;

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    titleRef.current?.focus();
  }, [confirmed, pendingEmail]);
  useEffect(() => {
    if (summary?.focus === "summary") summaryRef.current?.focus();
    else if (summary?.focus === "email") focusEmail("email");
    else if (summary?.focus === "code") focusCode("code");
  }, [summary, focusEmail, focusCode]);
  useEffect(() => {
    if (!deadline || confirmed || deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, confirmed]);

  function reportError(error: unknown) {
    if (requestRef.current?.signal.aborted) return;
    const failure = verificationError(error);
    if (failure.fields?.includes("email")) {
      emailForm.setValue("email", pendingEmail ?? emailForm.getValues("email"));
      emailForm.setError("email", { type: "server", message: failure.message });
      clearPendingEmail();
      setPending(null);
      setRemaining(0);
      codeForm.reset();
      setSummary({ message: failure.message, focus: "email" });
    } else if (pendingEmail && failure.fields?.includes("code")) {
      codeForm.setError("code", { type: "server", message: failure.message });
      setSummary({ message: failure.message, focus: "code" });
    } else setSummary({ message: failure.message, focus: "summary" });
  }

  const confirmation = useMutation({
    mutationFn: (values: VerificationValues) =>
      confirmEmail(values, requestRef.current?.signal),
    retry: false,
    onSuccess: () => {
      clearPendingEmail();
      setPending(null);
      setRemaining(0);
      codeForm.reset();
      emailForm.reset();
      setNotice("");
      setConfirmed(true);
    },
    onError: reportError,
  });
  const send = useMutation({
    mutationFn: (email: string) =>
      sendVerificationEmail(email, requestRef.current?.signal),
    retry: false,
    onSuccess: (_, email) => {
      const resendAvailableAt = Date.now() + 60_000;
      writePendingEmail(email, resendAvailableAt);
      setPending({ email, resendAvailableAt });
      setRemaining(60);
      setNotice(sentMessage);
      emailForm.reset();
    },
    onError: reportError,
  });
  const busy = confirmation.isPending || send.isPending;

  function prepareRequest() {
    emailForm.clearErrors();
    codeForm.clearErrors();
    setSummary(null);
    setNotice("");
    requestRef.current = new AbortController();
  }
  function onSend({ email }: { email: string }) {
    if (busy) return;
    prepareRequest();
    send.mutate(email);
  }
  function onConfirm({ code }: { code: string }) {
    if (busy || !pendingEmail) return;
    prepareRequest();
    confirmation.mutate({ email: pendingEmail, code });
  }
  function onResend() {
    if (busy || remaining > 0 || !pendingEmail) return;
    onSend({ email: pendingEmail });
  }
  function changeEmail() {
    if (busy) return;
    clearPendingEmail();
    setPending(null);
    setRemaining(0);
    setSummary(null);
    setNotice("");
    emailForm.reset();
    codeForm.reset();
    confirmation.reset();
    send.reset();
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-lg space-y-6 px-6 py-12 text-lg text-foreground">
      <h1 ref={titleRef} tabIndex={-1} className="text-3xl font-semibold">
        {confirmed
          ? "E-mail verificado"
          : pending
            ? "Informe o código de verificação"
            : "Verifique seu e-mail"}
      </h1>
      {confirmed ? (
        <>
          <p>Seu e-mail foi confirmado. Agora você pode entrar na sua conta.</p>
          <a
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Ir para o login
          </a>
        </>
      ) : (
        <>
          <p>
            {pending ? (
              <>
                E-mail para verificação: <span>{maskEmail(pending.email)}</span>
              </>
            ) : (
              "Informe seu e-mail para solicitar um código de verificação."
            )}
          </p>
          {summary && (
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="alert"
              className="rounded-md border-2 border-destructive p-4 text-destructive"
            >
              {summary.message}
            </div>
          )}
          {!pending ? (
            <form
              key="email-step"
              noValidate
              className="space-y-6"
              onSubmit={(event) => {
                void emailForm.handleSubmit(onSend, () =>
                  setSummary({
                    message: "Confira o e-mail informado para continuar.",
                    focus: "email",
                  }),
                )(event);
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="verification-email"
                  className="block font-medium"
                >
                  E-mail
                </label>
                <Input
                  id="verification-email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={busy}
                  {...emailForm.register("email")}
                  aria-invalid={Boolean(emailErrors.email)}
                  aria-describedby={
                    emailErrors.email ? "verification-email-error" : undefined
                  }
                  className={focusClass}
                />
                {emailErrors.email && (
                  <p id="verification-email-error" className="text-destructive">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={busy}
                aria-busy={send.isPending}
                className={`w-full ${focusClass}`}
              >
                {send.isPending ? "Enviando código..." : "Enviar código"}
              </Button>
            </form>
          ) : (
            <form
              key="code-step"
              noValidate
              className="space-y-6"
              onSubmit={(event) => {
                void codeForm.handleSubmit(onConfirm, () =>
                  setSummary({
                    message: "Confira o código informado para continuar.",
                    focus: "code",
                  }),
                )(event);
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="verification-code"
                  className="block font-medium"
                >
                  Código de verificação
                </label>
                <Input
                  id="verification-code"
                  type="text"
                  autoComplete="one-time-code"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  readOnly={confirmation.isPending}
                  {...codeForm.register("code")}
                  aria-invalid={Boolean(codeErrors.code)}
                  aria-describedby={
                    codeErrors.code ? "verification-code-error" : undefined
                  }
                  className={focusClass}
                />
                {codeErrors.code && (
                  <p id="verification-code-error" className="text-destructive">
                    {codeErrors.code.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={busy}
                aria-busy={confirmation.isPending}
                className={`w-full ${focusClass}`}
              >
                {confirmation.isPending ? "Verificando..." : "Confirmar e-mail"}
              </Button>
              <div className="space-y-3">
                <p id="resend-help">
                  Não recebeu o código? Confira o e-mail informado e a pasta de
                  spam.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || remaining > 0}
                  aria-busy={send.isPending}
                  aria-describedby={
                    remaining > 0
                      ? "resend-help resend-countdown"
                      : "resend-help"
                  }
                  className={`w-full ${focusClass}`}
                  onClick={onResend}
                >
                  {send.isPending ? "Solicitando código..." : "Reenviar código"}
                </Button>
                {remaining > 0 && (
                  <p id="resend-countdown">
                    Você pode solicitar outro código em {remaining} segundo
                    {remaining === 1 ? "" : "s"}.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  className={`w-full ${focusClass}`}
                  onClick={changeEmail}
                >
                  Alterar e-mail
                </Button>
              </div>
            </form>
          )}
          <p role="status" aria-atomic="true">
            {notice}
          </p>
        </>
      )}
    </main>
  );
}
