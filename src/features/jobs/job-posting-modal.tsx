import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { DefaultValues } from "react-hook-form";

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
import { createJob, type Job, myJobsQueryKey } from "./jobs-api";
import { jobPostingFailure } from "./jobs-errors";

const emptyJob: DefaultValues<JobPostingValues> = {
  title: "",
  description: "",
  closingDate: "",
  skills: [],
};

interface JobPostingModalProps {
  /** Runs only after the API confirmed the job, with the job it stored. */
  onPublished?: (job: Job) => void;
}

export function JobPostingModal({ onPublished }: JobPostingModalProps) {
  const [open, setOpen] = useState(false);
  // A new key gives the next opening a blank form.
  const [formKey, setFormKey] = useState(0);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createJob,
    retry: false,
    gcTime: 0,
    // Whatever the outcome, the list shows what the server stored: a request
    // that timed out may still have been committed.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: myJobsQueryKey }),
  });

  async function publish(values: JobPostingValues) {
    try {
      const job = await mutation.mutateAsync(values);
      setOpen(false);
      setFormKey((key) => key + 1);
      onPublished?.(job);
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-request would hide whether the job was published.
        if (!nextOpen && mutation.isPending) return;
        setOpen(nextOpen);
        if (!nextOpen) setFormKey((key) => key + 1);
      }}
    >
      <DialogTrigger render={<Button>Cadastrar nova vaga</Button>} />
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar nova vaga</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para publicar uma vaga para candidatos.
          </DialogDescription>
        </DialogHeader>
        <JobPostingForm
          key={formKey}
          mode="create"
          defaultValues={emptyJob}
          submitLabel="Publicar vaga"
          pendingLabel="Publicando…"
          pending={mutation.isPending}
          onSubmit={publish}
          describeFailure={jobPostingFailure}
        />
      </DialogContent>
    </Dialog>
  );
}
