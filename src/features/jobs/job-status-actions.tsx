import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { todayIsoDate } from "./job-posting-schema";
import { needsNewClosingDate, statusActionFor } from "./job-status";
import {
  changeJobStatus,
  type JobStatusChange,
  type JobSummary,
  myJobsQueryKey,
} from "./jobs-api";
import {
  isClosingDateInThePast,
  jobStatusChangeErrorMessage,
} from "./jobs-errors";

interface JobStatusActionsProps {
  job: JobSummary;
  /** Explains, once per page, why editing is not available yet. */
  editHintId: string;
  onChanged: (message: string) => void;
}

export function JobStatusActions({
  job,
  editHintId,
  onChanged,
}: JobStatusActionsProps) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"close" | "reopen" | null>(null);
  const [closingDate, setClosingDate] = useState("");
  const [closingDateError, setClosingDateError] = useState<string | null>(null);
  const closingDateId = useId();
  const closingDateErrorId = useId();
  const action = statusActionFor(job);

  const mutation = useMutation({
    mutationFn: changeJobStatus,
    retry: false,
    // A refused change may mean the job changed elsewhere: the list shows what
    // the server has either way.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: myJobsQueryKey }),
  });
  const pending = mutation.isPending;

  async function submit(change: JobStatusChange) {
    try {
      await mutation.mutateAsync(change);
      setDialog(null);
      onChanged(
        change.status === "closed"
          ? `A vaga “${job.title}” foi encerrada e saiu das buscas dos candidatos.`
          : `A vaga “${job.title}” foi reaberta e voltou às buscas dos candidatos.`,
      );
    } catch (error) {
      if (isClosingDateInThePast(error)) {
        setDialog("reopen");
        setClosingDateError(
          "A data de encerramento não pode estar no passado.",
        );
      }
    }
  }

  function reopen() {
    mutation.reset();
    if (needsNewClosingDate(job)) {
      setClosingDate("");
      setClosingDateError(null);
      setDialog("reopen");
      return;
    }
    void submit({ id: job.id, status: "open" });
  }

  function submitNewClosingDate() {
    if (!closingDate) {
      setClosingDateError("Informe a nova data de encerramento.");
      return;
    }
    if (closingDate < todayIsoDate()) {
      setClosingDateError("A data de encerramento não pode estar no passado.");
      return;
    }
    setClosingDateError(null);
    void submit({ id: job.id, status: "open", closingDate });
  }

  function closeDialog(open: boolean) {
    if (open || pending) return;
    setDialog(null);
    mutation.reset();
  }

  const failure =
    mutation.isError && action
      ? jobStatusChangeErrorMessage(mutation.error, action)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled
          aria-describedby={editHintId}
        >
          Editar
        </Button>
        {action === "close" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              mutation.reset();
              setDialog("close");
            }}
          >
            Encerrar
          </Button>
        ) : action === "reopen" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={reopen}
          >
            {pending && dialog === null ? "Reabrindo…" : "Reabrir"}
          </Button>
        ) : null}
      </div>
      {failure && dialog === null ? (
        <p role="alert" className="text-base text-destructive">
          {failure}
        </p>
      ) : null}

      <AlertDialog open={dialog === "close"} onOpenChange={closeDialog}>
        <AlertDialogContent className="rounded-xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Encerrar a vaga?
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{job.title}” deixa de aparecer nas buscas dos candidatos. As
              candidaturas recebidas continuam registradas, e você pode reabrir
              a vaga depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <p role="alert" className="text-base text-destructive">
              {failure}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => void submit({ id: job.id, status: "closed" })}
            >
              {pending ? "Encerrando…" : "Encerrar vaga"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialog === "reopen"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir a vaga</DialogTitle>
            <DialogDescription>
              O prazo de “{job.title}” já passou. Escolha até quando a vaga fica
              aberta para os candidatos.
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              submitNewClosingDate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={closingDateId}>Nova data de encerramento *</Label>
              <Input
                id={closingDateId}
                type="date"
                min={todayIsoDate()}
                value={closingDate}
                onChange={(event) => setClosingDate(event.target.value)}
                disabled={pending}
                aria-required="true"
                aria-invalid={Boolean(closingDateError)}
                aria-describedby={
                  closingDateError ? closingDateErrorId : undefined
                }
              />
              {closingDateError ? (
                <p
                  id={closingDateErrorId}
                  role="alert"
                  className="text-destructive"
                >
                  {closingDateError}
                </p>
              ) : null}
            </div>
            {failure && !closingDateError ? (
              <p role="alert" className="text-destructive">
                {failure}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose
                disabled={pending}
                render={
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" disabled={pending}>
                {pending ? "Reabrindo…" : "Reabrir vaga"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
