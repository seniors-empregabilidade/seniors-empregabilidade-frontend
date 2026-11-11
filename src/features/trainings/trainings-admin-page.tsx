import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { LoadingSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { safeExternalUrl } from "./safe-external-url";
import { TrainingFormDialog } from "./training-form-dialog";
import { TrainingStatusAction } from "./training-status-action";
import {
  type AdminTraining,
  adminTrainingsQueryOptions,
  defaultTrainingFilters,
  TRAINING_TITLE_MAX_LENGTH,
  trainingModeLabels,
  TRAININGS_PAGE_SIZE,
  trainingsErrorMessage,
  type TrainingFilters,
} from "./trainings-admin-api";

const SEARCH_DELAY_MS = 300;

const selectClassName =
  "h-12 w-full min-w-0 rounded-md border-[1.5px] border-input bg-background px-3.5 text-lg text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TrainingsAdminPage() {
  const [filters, setFilters] = useState<TrainingFilters>(
    defaultTrainingFilters,
  );
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(
    null,
  );
  const search = useDebouncedValue(filters.search.trim(), SEARCH_DELAY_MS);
  const trainings = useQuery(
    adminTrainingsQueryOptions({ ...filters, search }),
  );
  const page = trainings.data;
  const searchId = useId();
  const statusId = useId();

  function changeFilter<K extends keyof TrainingFilters>(
    key: K,
    value: TrainingFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value, offset: 0 }));
  }

  function announce(message: string) {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  const filtered = search !== "" || filters.published !== "all";
  const rangeStart = page && page.items.length > 0 ? filters.offset + 1 : 0;
  const rangeEnd =
    page && page.items.length > 0 ? filters.offset + page.items.length : 0;
  const hasPrevious = filters.offset > 0;
  const hasNext = page
    ? filters.offset + page.items.length < page.total
    : false;

  return (
    <div className="min-h-full bg-muted p-4 pb-24 md:p-8 md:pb-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Capacitação</h1>
          <p className="text-lg text-muted-foreground">
            Cadastre e mantenha os cursos indicados aos candidatos, com as
            competências e as vagas a que se relacionam.
          </p>
        </div>
        <TrainingFormDialog onSaved={announce} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={searchId}>Buscar por nome ou instituição</Label>
          <Input
            id={searchId}
            type="search"
            autoComplete="off"
            maxLength={TRAINING_TITLE_MAX_LENGTH}
            value={filters.search}
            onChange={(event) => changeFilter("search", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={statusId}>Situação</Label>
          <select
            id={statusId}
            className={selectClassName}
            value={filters.published}
            onChange={(event) =>
              changeFilter(
                "published",
                event.target.value as TrainingFilters["published"],
              )
            }
          >
            <option value="all">Todos</option>
            <option value="published">Publicado</option>
            <option value="unpublished">Inativo</option>
          </select>
        </div>
      </div>

      <div role="status">
        {notice ? (
          <p
            key={notice.id}
            className="mb-6 rounded-lg border border-success bg-background p-4 text-lg text-foreground"
          >
            {notice.message}
          </p>
        ) : null}
      </div>

      {trainings.isPending ? (
        <LoadingSkeleton label="Carregando cursos…" />
      ) : trainings.isError ? (
        <div
          role="alert"
          className="flex max-w-xl flex-col items-start gap-4 rounded-lg border border-destructive bg-background p-6"
        >
          <p className="text-lg text-foreground">
            {trainingsErrorMessage(trainings.error)}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void trainings.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : page && page.items.length === 0 ? (
        <p className="rounded-lg border-[1.5px] border-border bg-background p-6 text-lg text-muted-foreground">
          {filters.offset > 0
            ? "Não há mais cursos nesta página. Volte para a página anterior."
            : filtered
              ? "Nenhum curso encontrado com esses filtros."
              : "Ainda não há cursos cadastrados. Cadastre o primeiro."}
        </p>
      ) : page ? (
        <div
          role="region"
          aria-label="Tabela de cursos"
          // A focusable scroll region supports keyboard scrolling in Safari.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="overflow-x-auto rounded-lg border-[1.5px] border-border bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <caption className="sr-only">Cursos cadastrados</caption>
            <thead className="border-b border-border bg-muted">
              <tr>
                {[
                  "Curso",
                  "Modalidade",
                  "Competências",
                  "Vagas",
                  "Situação",
                  "Ações",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-base font-semibold text-foreground"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.items.map((training) => (
                <TrainingRow
                  key={training.id}
                  training={training}
                  onChanged={announce}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {page && !trainings.isError && (page.total > 0 || hasPrevious) ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-base text-muted-foreground">
            {rangeStart}–{rangeEnd} de {page.total}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!hasPrevious}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  offset: Math.max(0, current.offset - TRAININGS_PAGE_SIZE),
                }))
              }
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!hasNext}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  offset: current.offset + TRAININGS_PAGE_SIZE,
                }))
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrainingRow({
  training,
  onChanged,
}: {
  training: AdminTraining;
  onChanged: (message: string) => void;
}) {
  const href = safeExternalUrl(training.external_link);
  const institution = training.institution?.trim() ?? "";
  const jobCount = training.job_ids.length;

  return (
    <tr className="border-b border-border last:border-b-0">
      <th
        scope="row"
        className="px-4 py-3 text-lg font-semibold break-words text-foreground"
      >
        {training.title}
        {institution === "" ? null : (
          <span className="block text-base font-normal text-muted-foreground">
            {institution}
          </span>
        )}
        {href === null ? null : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir o link de ${training.title} em nova aba`}
            className="inline-flex min-h-11 items-center text-base font-normal text-primary underline underline-offset-4"
          >
            Abrir link
          </a>
        )}
      </th>
      <td className="px-4 py-3 text-base text-foreground">
        {training.mode === null ? "—" : trainingModeLabels[training.mode]}
      </td>
      <td className="px-4 py-3 text-base break-words text-foreground">
        {training.skills.length === 0
          ? "—"
          : training.skills.map((skill) => skill.name).join(", ")}
      </td>
      <td className="px-4 py-3 text-base text-foreground">{jobCount}</td>
      <td className="px-4 py-3 text-base text-foreground">
        {training.published ? "Publicado" : "Inativo"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <TrainingFormDialog training={training} onSaved={onChanged} />
          <TrainingStatusAction training={training} onChanged={onChanged} />
        </div>
      </td>
    </tr>
  );
}
