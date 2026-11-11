import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { jobStatusLabels } from "@/lib/job-status-labels";

import {
  JOB_SEARCH_MAX_LENGTH,
  jobOptionsErrorMessage,
  jobOptionsQueryOptions,
  TRAINING_MAX_JOBS,
  type TrainingJob,
} from "./trainings-admin-api";

const SEARCH_DELAY_MS = 300;

interface TrainingJobPickerProps {
  value: TrainingJob[];
  onChange: (jobs: TrainingJob[]) => void;
  disabled?: boolean;
  errorMessage?: string | undefined;
}

export function TrainingJobPicker({
  value,
  onChange,
  disabled = false,
  errorMessage,
}: TrainingJobPickerProps) {
  const uid = useId();
  const searchId = `${uid}-search`;
  const errorId = `${uid}-error`;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const options = useQuery(jobOptionsQueryOptions(debouncedSearch));
  const selectedIds = new Set(value.map((job) => job.id));
  const limitReached = value.length >= TRAINING_MAX_JOBS;
  const searchRef = useRef<HTMLInputElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterRemoval = useRef<number | null>(null);

  // The focused "Remover" button leaves with its job, so focus moves to the
  // job now in that position, or to the search field when none is left.
  useEffect(() => {
    const index = focusAfterRemoval.current;
    if (index === null) return;
    focusAfterRemoval.current = null;
    const next = value[Math.min(index, value.length - 1)];
    const target = next
      ? removeButtons.current.get(next.id)
      : searchRef.current;
    target?.focus();
  }, [value]);

  function toggle(job: TrainingJob) {
    onChange(
      selectedIds.has(job.id)
        ? value.filter((selected) => selected.id !== job.id)
        : [...value, { id: job.id, title: job.title }],
    );
  }

  function remove(job: TrainingJob, index: number) {
    focusAfterRemoval.current = index;
    onChange(value.filter((selected) => selected.id !== job.id));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={searchId}>Vagas relacionadas</Label>
        <p className="text-base text-muted-foreground">
          Busque pelo título e marque as vagas para as quais o curso prepara.
        </p>
        <Input
          ref={searchRef}
          id={searchId}
          type="search"
          autoComplete="off"
          maxLength={JOB_SEARCH_MAX_LENGTH}
          placeholder="Buscar vaga pelo título"
          value={search}
          disabled={disabled}
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div role="status" className="text-base text-muted-foreground">
        {value.length === 0
          ? "Nenhuma vaga relacionada."
          : `${value.length} ${value.length === 1 ? "vaga relacionada" : "vagas relacionadas"}.`}
      </div>

      {value.length > 0 ? (
        <ul
          aria-label="Vagas relacionadas ao curso"
          className="flex list-none flex-wrap gap-2 p-0"
        >
          {value.map((job, index) => (
            <li
              key={job.id}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-muted py-1 pr-1 pl-3 text-base text-foreground"
            >
              <span className="break-words">{job.title}</span>
              <Button
                ref={(element: HTMLButtonElement | null) => {
                  if (element) removeButtons.current.set(job.id, element);
                  else removeButtons.current.delete(job.id);
                }}
                type="button"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remover ${job.title}`}
                onClick={() => remove(job, index)}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {options.isPending ? (
        <p role="status" className="text-base text-muted-foreground">
          Carregando vagas…
        </p>
      ) : options.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-base text-destructive">
            {jobOptionsErrorMessage()}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void options.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : options.data.items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {debouncedSearch === ""
            ? "Ainda não há vagas cadastradas."
            : `Nenhuma vaga encontrada para “${debouncedSearch}”.`}
        </p>
      ) : (
        <fieldset className="min-w-0 space-y-1" disabled={disabled}>
          <legend className="text-base leading-none font-medium">
            Vagas encontradas
          </legend>
          <ul className="max-h-56 list-none overflow-y-auto rounded-lg border border-border p-2">
            {options.data.items.map((job) => {
              const checked = selectedIds.has(job.id);
              return (
                <li key={job.id}>
                  <label className="flex min-h-11 items-center gap-3 text-lg">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={checked}
                      disabled={!checked && limitReached}
                      onChange={() => toggle(job)}
                    />
                    <span className="break-words">
                      {job.title}{" "}
                      <span className="text-base text-muted-foreground">
                        ({job.company_name} · {jobStatusLabels[job.status]})
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {options.data.total > options.data.items.length ? (
            <p className="text-base text-muted-foreground">
              Mostrando {options.data.items.length} de {options.data.total}{" "}
              vagas. Refine a busca para encontrar outras.
            </p>
          ) : null}
        </fieldset>
      )}

      {limitReached ? (
        <p className="text-base text-muted-foreground">
          Limite de {TRAINING_MAX_JOBS} vagas por curso atingido.
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} role="alert" className="text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
