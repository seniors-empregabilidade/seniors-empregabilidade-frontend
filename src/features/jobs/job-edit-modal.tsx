import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { JobPostingForm } from "./job-posting-form";
import type { JobPostingValues } from "./job-posting-schema";
import {
  type Job,
  type JobSummary,
  myJobsQueryKey,
  updateJob,
} from "./jobs-api";
import { jobEditFailure } from "./jobs-errors";

interface JobEditModalProps {
  job: JobSummary;
  /** Runs only after the API confirmed the change, with the job it stored. */
  onSaved?: (job: Job) => void;
  /**
   * Offers "Encerrar vaga" in the modal once nothing is left unsaved. The modal
   * closes and hands over to the confirmation the caller owns, so closing a job
   * always goes through it.
   */
  onRequestClose?: () => void;
}

/** The form opens with what the job has now. */
function currentValues(job: JobSummary) {
  return {
    title: job.title,
    description: job.description,
    skills: job.skills.map(({ name, type }) => ({ name, type })),
    workMode: job.work_mode,
    closingDate: job.closing_date,
  };
}

export function JobEditModal({
  job,
  onSaved,
  onRequestClose,
}: JobEditModalProps) {
  const [open, setOpen] = useState(false);
  // A new key makes the next opening start from the job again, discarding
  // whatever was typed and not saved.
  const [formKey, setFormKey] = useState(0);
  // A refused or lost save may mean the job changed or no longer exists. The
  // list refreshes only once the modal closes: a job gone from it would take
  // its card, and this modal, away before the person reads why.
  const listMayBeStale = useRef(false);
  const closeHintId = useId();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateJob,
    retry: false,
    gcTime: 0,
    // The list already shows the change when the modal closes.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myJobsQueryKey }),
    onError: () => {
      listMayBeStale.current = true;
    },
  });

  function discard() {
    setOpen(false);
    setFormKey((key) => key + 1);
    if (listMayBeStale.current) {
      listMayBeStale.current = false;
      void queryClient.invalidateQueries({ queryKey: myJobsQueryKey });
    }
  }

  async function save({ title, description, skills }: JobPostingValues) {
    try {
      const saved = await mutation.mutateAsync({
        id: job.id,
        title,
        description,
        skills,
      });
      discard();
      onSaved?.(saved);
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-request would hide whether the change was saved.
        if (!nextOpen && mutation.isPending) return;
        if (nextOpen) setOpen(true);
        else discard();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            Editar
          </Button>
        }
      />
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar vaga</DialogTitle>
          <DialogDescription>
            Altere o título, a descrição e as habilidades de “{job.title}”. A
            modalidade e o prazo da vaga continuam como estão.
          </DialogDescription>
        </DialogHeader>
        <JobPostingForm
          key={formKey}
          mode="edit"
          defaultValues={currentValues(job)}
          submitLabel="Salvar"
          pendingLabel="Salvando…"
          pending={mutation.isPending}
          onSubmit={save}
          describeFailure={jobEditFailure}
          {...(onRequestClose
            ? {
                footerStart: ({ busy, dirty }) => (
                  <div className="flex flex-col gap-1 sm:mr-auto sm:max-w-64">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || dirty}
                      aria-describedby={dirty ? closeHintId : undefined}
                      onClick={() => {
                        discard();
                        onRequestClose();
                      }}
                    >
                      Encerrar vaga
                    </Button>
                    {dirty ? (
                      <p
                        id={closeHintId}
                        className="text-base text-muted-foreground"
                      >
                        Salve ou cancele as alterações para encerrar a vaga.
                      </p>
                    ) : null}
                  </div>
                ),
              }
            : {})}
        />
      </DialogContent>
    </Dialog>
  );
}
