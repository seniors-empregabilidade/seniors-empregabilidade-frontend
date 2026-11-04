import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

import {
  MAX_MESSAGE_LENGTH,
  contactErrorMessage,
  contactProfessional,
} from "./contact-professional";

interface ContactProfessionalDialogProps {
  jobId: string;
  /** Título da vaga, se a tela já o tiver. Sem ele, mostramos um texto genérico. */
  jobTitle?: string;
  candidateId: string;
  professionalName: string;
  onClose: () => void;
}

export function ContactProfessionalDialog({
  jobId,
  jobTitle,
  candidateId,
  professionalName,
  onClose,
}: ContactProfessionalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const hintId = useId();
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({ mutationFn: contactProfessional });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (message.trim().length === 0) {
      setValidationError("Escreva uma mensagem antes de enviar.");
      return;
    }

    setValidationError(null);
    mutation.mutate({ jobId, candidateId, message });
  }

  const sent = mutation.isSuccess;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(92vw,40rem)] rounded-lg border border-rule bg-background p-6 text-foreground backdrop:bg-foreground/40"
    >
      <h2 id={titleId} className="text-2xl font-bold">
        Entrar em contato
      </h2>
      <p className="mt-2 text-lg text-foreground-2">
        Profissional: <strong>{professionalName}</strong>
      </p>
      <p className="text-lg text-foreground-2">
        Vaga relacionada: <strong>{jobTitle ?? "esta vaga"}</strong>
      </p>

      {sent ? (
        <div role="status" className="mt-6 flex flex-col gap-4">
          <p className="text-lg text-foreground">
            Mensagem enviada. {professionalName} a recebe na central de
            notificações e por e-mail.
          </p>
          <Button type="button" onClick={() => dialogRef.current?.close()}>
            Fechar
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-lg font-semibold">
              Mensagem
            </label>
            <textarea
              id={fieldId}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={7}
              aria-describedby={hintId}
              aria-invalid={validationError !== null}
              disabled={mutation.isPending}
              className="w-full rounded-md border border-rule bg-background p-3 text-base text-foreground"
            />
            <p id={hintId} className="text-base text-foreground-2">
              O profissional não pode responder pela plataforma. Informe na
              mensagem como a empresa quer ser contatada. O e-mail pessoal do
              profissional não é exibido para você.
            </p>
            <p className="text-base text-muted-foreground">
              {message.length} de {MAX_MESSAGE_LENGTH} caracteres
            </p>
          </div>

          {validationError ? (
            <p
              role="alert"
              className="text-base font-semibold text-destructive"
            >
              {validationError}
            </p>
          ) : null}

          {mutation.isError ? (
            <p
              role="alert"
              className="text-base font-semibold text-destructive"
            >
              {contactErrorMessage(mutation.error)}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => dialogRef.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
