import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
   * Offers "Encerrar vaga" in the modal. The modal closes, discarding what was
   * typed, and hands over to the confirmation the caller owns, so closing a
   * job always goes through it.
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
  const [saving, setSaving] = useState(false);
  // A new key makes the next opening start from the job again, discarding
  // whatever was typed and not saved.
  const [formKey, setFormKey] = useState(0);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateJob,
    retry: false,
    gcTime: 0,
    // Whatever the outcome, the list shows what the server stored.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: myJobsQueryKey }),
  });

  function discard() {
    setOpen(false);
    setFormKey((key) => key + 1);
  }

  async function save({ title, description, skills }: JobPostingValues) {
    setSaving(true);
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
      setSaving(false);
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-request would hide whether the change was saved.
        if (!nextOpen && saving) return;
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
          pending={saving}
          onSubmit={save}
          describeFailure={jobEditFailure}
          {...(onRequestClose
            ? {
                footerStart: (busy) => (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="sm:mr-auto"
                    onClick={() => {
                      discard();
                      onRequestClose();
                    }}
                  >
                    Encerrar vaga
                  </Button>
                ),
              }
            : {})}
        />
      </DialogContent>
    </Dialog>
  );
}
