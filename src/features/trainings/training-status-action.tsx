import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  type AdminTraining,
  adminTrainingsQueryKey,
  changeTrainingPublication,
  trainingPublicationErrorMessage,
} from "./trainings-admin-api";

interface TrainingStatusActionProps {
  training: AdminTraining;
  onChanged: (message: string) => void;
}

export function TrainingStatusAction({
  training,
  onChanged,
}: TrainingStatusActionProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  // Inactivating means unpublishing; the course and its relations stay.
  const nextPublished = !training.published;

  const mutation = useMutation({
    mutationFn: () => changeTrainingPublication(training.id, nextPublished),
    retry: false,
    // A refused change may mean the course changed elsewhere: the list shows
    // what the server has either way.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminTrainingsQueryKey }),
  });
  const pending = mutation.isPending;

  async function submit() {
    try {
      await mutation.mutateAsync();
      setConfirming(false);
      onChanged(
        nextPublished
          ? `Curso “${training.title}” reativado e de volta à busca dos candidatos.`
          : `Curso “${training.title}” inativado. Ele não aparece mais para os candidatos.`,
      );
    } catch {
      // The message is rendered from mutation.error.
    }
  }

  function start() {
    mutation.reset();
    if (!nextPublished) {
      setConfirming(true);
      return;
    }
    void submit();
  }

  const failure = mutation.isError
    ? trainingPublicationErrorMessage(mutation.error, nextPublished)
    : null;

  return (
    <>
      {/* One button whose label follows the status keeps keyboard focus in
          place when the row is refreshed after the change. */}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        aria-label={
          nextPublished
            ? `Reativar ${training.title}`
            : `Inativar ${training.title}`
        }
        onClick={start}
      >
        {nextPublished ? (pending ? "Reativando…" : "Reativar") : "Inativar"}
      </Button>
      {failure && !confirming ? (
        <p role="alert" className="basis-full text-base text-destructive">
          {failure}
        </p>
      ) : null}

      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (open || pending) return;
          setConfirming(false);
          mutation.reset();
        }}
      >
        <AlertDialogContent className="rounded-xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Inativar o curso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{training.title}” deixa de aparecer na busca de cursos dos
              candidatos. As competências e as vagas relacionadas são mantidas,
              e você pode reativá-lo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <p role="alert" className="text-base text-destructive">
              {failure}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => void submit()}>
              {pending ? "Inativando…" : "Inativar curso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
