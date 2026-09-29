import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { formatIsoDate, workModeLabels } from "./job-labels";
import { JobPostingModal } from "./job-posting-modal";
import {
  applicationCountLabel,
  isOpenToCandidates,
  jobStatusLabel,
} from "./job-status";
import { JobStatusActions } from "./job-status-actions";
import { type JobSummary, myJobsQueryOptions } from "./jobs-api";
import { isAwaitingApproval, myJobsErrorMessage } from "./jobs-errors";

export function MyJobsPage() {
  const [notice, setNotice] = useState<string | null>(null);
  const editHintId = useId();
  const jobs = useQuery(myJobsQueryOptions);
  const awaitingApproval = isAwaitingApproval(jobs.error);
  const openCount = jobs.data?.filter((job) => isOpenToCandidates(job)).length;

  return (
    <div className="min-h-full bg-muted p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Minhas vagas</h1>
          {openCount === undefined || jobs.data?.length === 0 ? null : (
            <p className="text-lg text-muted-foreground">
              {openCount === 1
                ? "1 vaga aberta para candidatos"
                : `${openCount} vagas abertas para candidatos`}
            </p>
          )}
        </div>
        {awaitingApproval ? null : (
          <JobPostingModal
            onPublished={(job) =>
              setNotice(
                `A vaga “${job.title}” foi publicada e já aparece na lista.`,
              )
            }
          />
        )}
      </div>

      {/* Rendered empty from the start so the confirmation is announced. */}
      <div role="status">
        {notice ? (
          <div className="mb-6 flex flex-col gap-1 rounded-lg border border-success bg-background p-4">
            <span className="font-mono text-base font-semibold tracking-wide text-success uppercase">
              Sucesso
            </span>
            <p className="text-lg text-foreground">{notice}</p>
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
          <span className="font-mono text-base font-semibold tracking-wide text-destructive uppercase">
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
        <>
          <p id={editHintId} className="mb-4 text-base text-muted-foreground">
            A edição de vagas estará disponível em breve.
          </p>
          <ul className="flex flex-col gap-4">
            {jobs.data.map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  editHintId={editHintId}
                  onStatusChanged={setNotice}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

interface JobCardProps {
  job: JobSummary;
  editHintId: string;
  onStatusChanged: (message: string) => void;
}

function JobCard({ job, editHintId, onStatusChanged }: JobCardProps) {
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
          className={`font-mono text-base font-semibold tracking-wide uppercase ${
            isOpenToCandidates(job) ? "text-success" : "text-muted-foreground"
          }`}
        >
          {jobStatusLabel(job)}
        </span>
      </div>
      <p className="text-base text-muted-foreground">
        {workModeLabels[job.work_mode]} · Encerra em{" "}
        {formatIsoDate(job.closing_date)} ·{" "}
        {applicationCountLabel(job.application_count)}
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
      <JobStatusActions
        job={job}
        editHintId={editHintId}
        onChanged={onStatusChanged}
      />
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
