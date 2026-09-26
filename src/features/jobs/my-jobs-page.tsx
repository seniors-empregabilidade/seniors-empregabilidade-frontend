import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { formatIsoDate, jobStatusLabels, workModeLabels } from "./job-labels";
import { JobPostingModal } from "./job-posting-modal";
import { type Job, myJobsQueryOptions } from "./jobs-api";
import { isAwaitingApproval, myJobsErrorMessage } from "./jobs-errors";

export function MyJobsPage() {
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);
  const jobs = useQuery(myJobsQueryOptions);
  const awaitingApproval = isAwaitingApproval(jobs.error);

  return (
    <div className="min-h-full bg-muted p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Minhas vagas</h1>
        {awaitingApproval ? null : (
          <JobPostingModal
            onPublished={(job) => setPublishedTitle(job.title)}
          />
        )}
      </div>

      {/* Rendered empty from the start so the confirmation is announced. */}
      <div role="status">
        {publishedTitle ? (
          <div className="mb-6 flex flex-col gap-1 rounded-lg border border-success bg-background p-4">
            <span className="font-mono text-[13px] font-semibold tracking-wide text-success uppercase">
              Sucesso
            </span>
            <p className="text-lg text-foreground">
              A vaga “{publishedTitle}” foi publicada e já aparece na lista.
            </p>
          </div>
        ) : null}
      </div>

      {jobs.isPending ? (
        <JobListSkeleton />
      ) : jobs.isError ? (
        <div
          role="alert"
          className="flex max-w-xl flex-col items-start gap-4 rounded-lg border border-destructive bg-background p-6"
        >
          <span className="font-mono text-[13px] font-semibold tracking-wide text-destructive uppercase">
            Erro
          </span>
          <p className="text-lg text-foreground">
            {myJobsErrorMessage(jobs.error)}
          </p>
          {awaitingApproval ? null : (
            <Button
              type="button"
              variant="outline"
              onClick={() => void jobs.refetch()}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      ) : jobs.data.length === 0 ? (
        <p className="rounded-lg border-[1.5px] border-border bg-background p-6 text-lg text-muted-foreground">
          Você ainda não publicou vagas. Use “Cadastrar nova vaga” para publicar
          a primeira.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {jobs.data.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const titleId = `job-${job.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg border-[1.5px] border-border bg-background p-[22px]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2
          id={titleId}
          className="text-xl font-bold break-words text-foreground"
        >
          {job.title}
        </h2>
        <span
          className={`font-mono text-[13px] font-semibold tracking-wide uppercase ${
            job.status === "published"
              ? "text-success"
              : "text-muted-foreground"
          }`}
        >
          {jobStatusLabels[job.status]}
        </span>
      </div>
      <p className="text-base text-muted-foreground">
        {workModeLabels[job.work_mode]} · Encerra em{" "}
        {formatIsoDate(job.closing_date)}
      </p>
      {job.description ? (
        <p className="line-clamp-3 text-lg break-words whitespace-pre-line text-foreground-2">
          {job.description}
        </p>
      ) : null}
      <ul aria-label="Habilidades" className="flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <li
            key={skill.id}
            className="rounded-full border border-border bg-accent px-3 py-1.5 text-base text-foreground"
          >
            {skill.name}
          </li>
        ))}
      </ul>
    </article>
  );
}

function JobListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        Carregando suas vagas…
      </p>
      <div
        aria-hidden="true"
        className="h-40 animate-pulse rounded-lg bg-accent motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-40 animate-pulse rounded-lg bg-accent motion-reduce:animate-none"
      />
    </div>
  );
}
