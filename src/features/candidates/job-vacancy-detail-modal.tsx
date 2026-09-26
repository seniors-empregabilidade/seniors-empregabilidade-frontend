import { useMutation } from "@tanstack/react-query";
import { CircleCheck, CircleMinus, XIcon } from "lucide-react";
import { useId, useState } from "react";

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

import { applyToJobVacancy } from "./job-vacancies-api";
import { applyToJobVacancyErrorMessage } from "./job-vacancy-errors";
import { companyInitials, formatVacancyMeta } from "./job-vacancy-format";
import { matchJobVacancySkills } from "./job-vacancy-match";
import type { JobVacancy } from "./job-vacancy-schema";

interface JobVacancyDetailModalProps {
  vacancy: JobVacancy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateSkillNames?: string[];
}

export function JobVacancyDetailModal({
  vacancy,
  open,
  onOpenChange,
  candidateSkillNames = [],
}: JobVacancyDetailModalProps) {
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedHere, setAppliedHere] = useState(false);
  const [trackedOpen, setTrackedOpen] = useState(open);
  const successId = useId();
  const errorId = useId();

  if (open !== trackedOpen) {
    setTrackedOpen(open);
    if (!open) {
      setApplyError(null);
      setAppliedHere(false);
    }
  }

  const mutation = useMutation({
    mutationFn: (jobPostingId: string) => applyToJobVacancy(jobPostingId),
    retry: false,
    gcTime: 0,
  });

  const alreadyApplied = Boolean(vacancy?.has_applied) || appliedHere;
  const isClosed = vacancy?.status === "closed";
  const canApply = Boolean(vacancy) && !alreadyApplied && !isClosed;
  const busy = mutation.isPending;

  async function handleApply() {
    if (!vacancy || !canApply || busy) return;

    setApplyError(null);

    try {
      await mutation.mutateAsync(vacancy.id);
      setAppliedHere(true);
    } catch (error) {
      setApplyError(applyToJobVacancyErrorMessage(error));
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(100%-2rem,40rem)] max-w-none gap-6 overflow-visible p-6 sm:p-8"
      >
        {vacancy ? (
          <VacancyDetail
            vacancy={vacancy}
            candidateSkillNames={candidateSkillNames}
            alreadyApplied={alreadyApplied}
            isClosed={isClosed}
            canApply={canApply}
            busy={busy}
            applySuccess={appliedHere}
            applyError={applyError}
            successId={successId}
            errorId={errorId}
            onApply={() => {
              void handleApply();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function VacancyDetail({
  vacancy,
  candidateSkillNames,
  alreadyApplied,
  isClosed,
  canApply,
  busy,
  applySuccess,
  applyError,
  successId,
  errorId,
  onApply,
}: {
  vacancy: JobVacancy;
  candidateSkillNames: string[];
  alreadyApplied: boolean;
  isClosed: boolean;
  canApply: boolean;
  busy: boolean;
  applySuccess: boolean;
  applyError: string | null;
  successId: string;
  errorId: string;
  onApply: () => void;
}) {
  const meta = formatVacancyMeta(vacancy);
  const match = matchJobVacancySkills(vacancy.skills, candidateSkillNames);
  const actionLabel = applyButtonLabel({
    busy,
    alreadyApplied,
    isClosed,
  });

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              data-logo="empresa"
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent text-base font-semibold text-foreground-2"
            >
              {companyInitials(vacancy.company_name)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold">
                {vacancy.title}
              </DialogTitle>
              <p className="mt-1 text-base text-muted-foreground">
                {vacancy.company_name}
              </p>
              {meta ? (
                <DialogDescription className="mt-1 text-base">
                  {meta}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Detalhes da vaga {vacancy.title} na empresa{" "}
                  {vacancy.company_name}.
                </DialogDescription>
              )}
            </div>
          </div>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <XIcon />
                <span className="sr-only">Fechar</span>
              </Button>
            }
          />
        </div>
      </DialogHeader>

      <CompatibilitySection match={match} />

      <section>
        <h3 className="mb-2 text-lg font-bold text-foreground">
          Descrição da vaga
        </h3>
        <p className="text-lg leading-6 whitespace-pre-line text-foreground">
          {vacancy.description}
        </p>
      </section>

      {applySuccess ? (
        <div
          id={successId}
          role="status"
          className="rounded-[10px] border border-success bg-background p-4"
        >
          <p className="font-mono text-[13px] font-semibold tracking-wide text-success uppercase">
            Sucesso
          </p>
          <p className="mt-1 text-lg text-foreground">Candidatura enviada</p>
        </div>
      ) : null}

      {applyError ? (
        <div
          id={errorId}
          role="alert"
          className="rounded-[10px] border border-destructive bg-background p-4"
        >
          <p className="font-mono text-[13px] font-semibold tracking-wide text-destructive uppercase">
            Erro
          </p>
          <p className="mt-1 text-lg text-foreground">{applyError}</p>
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose
          render={
            <Button type="button" variant="outline" className="rounded-full">
              Fechar
            </Button>
          }
        />
        {canApply ? (
          <Button
            type="button"
            onClick={onApply}
            disabled={busy}
            aria-busy={busy}
            aria-describedby={applyError ? errorId : undefined}
            className="rounded-full"
          >
            {actionLabel}
          </Button>
        ) : (
          <Button type="button" disabled className="rounded-full">
            {actionLabel}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

function CompatibilitySection({
  match,
}: {
  match: ReturnType<typeof matchJobVacancySkills>;
}) {
  return (
    <section>
      <h3 className="mb-2 text-lg font-bold text-foreground">
        Como você se encaixa
      </h3>
      {match.total === 0 ? (
        <p className="text-lg text-muted-foreground">
          Esta vaga ainda não listou requisitos de habilidades.
        </p>
      ) : (
        <>
          <p className="mb-2 text-base text-muted-foreground">
            Você atende {match.matched.length} de {match.total} requisitos
          </p>
          <ul className="flex flex-col gap-2">
            {match.matched.map((skill) => (
              <li
                key={`matched-${skill}`}
                className="flex items-start gap-3 text-lg text-foreground"
              >
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-foreground"
                />
                <span>
                  <span className="sr-only">Requisito atendido: </span>
                  {skill}
                </span>
              </li>
            ))}
            {match.missing.map((skill) => (
              <li
                key={`missing-${skill}`}
                className="flex items-start gap-3 text-lg text-foreground"
              >
                <CircleMinus
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <span>
                  <span className="sr-only">Habilidade em falta: </span>
                  {skill}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function applyButtonLabel({
  busy,
  alreadyApplied,
  isClosed,
}: {
  busy: boolean;
  alreadyApplied: boolean;
  isClosed: boolean;
}): string {
  if (busy) return "Enviando candidatura…";
  if (alreadyApplied) return "Já candidatado";
  if (isClosed) return "Vaga encerrada";
  return "Candidatar-se";
}
