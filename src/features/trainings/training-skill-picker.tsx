import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { skillTypeLabels } from "@/lib/skill-type";

import {
  SKILL_SEARCH_MAX_LENGTH,
  skillOptionsErrorMessage,
  skillOptionsQueryOptions,
  TRAINING_MAX_SKILLS,
  type TrainingSkill,
} from "./trainings-admin-api";

const SEARCH_DELAY_MS = 300;

interface TrainingSkillPickerProps {
  value: TrainingSkill[];
  onChange: (skills: TrainingSkill[]) => void;
  disabled?: boolean;
  errorMessage?: string | undefined;
}

export function TrainingSkillPicker({
  value,
  onChange,
  disabled = false,
  errorMessage,
}: TrainingSkillPickerProps) {
  const uid = useId();
  const searchId = `${uid}-search`;
  const errorId = `${uid}-error`;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const options = useQuery(skillOptionsQueryOptions(debouncedSearch));
  const selectedIds = new Set(value.map((skill) => skill.id));
  const limitReached = value.length >= TRAINING_MAX_SKILLS;
  const searchRef = useRef<HTMLInputElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterRemoval = useRef<number | null>(null);

  // The focused "Remover" button leaves with its skill, so focus moves to the
  // skill now in that position, or to the search field when none is left.
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

  function toggle(skill: TrainingSkill) {
    onChange(
      selectedIds.has(skill.id)
        ? value.filter((selected) => selected.id !== skill.id)
        : [...value, skill],
    );
  }

  function remove(skill: TrainingSkill, index: number) {
    focusAfterRemoval.current = index;
    onChange(value.filter((selected) => selected.id !== skill.id));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={searchId}>Competências relacionadas</Label>
        <p className="text-base text-muted-foreground">
          Busque no catálogo e marque as competências que o curso desenvolve.
          Candidatos com essas competências em falta encontram o curso na busca.
        </p>
        <Input
          ref={searchRef}
          id={searchId}
          type="search"
          autoComplete="off"
          maxLength={SKILL_SEARCH_MAX_LENGTH}
          placeholder="Buscar competência"
          value={search}
          disabled={disabled}
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div role="status" className="text-base text-muted-foreground">
        {value.length === 0
          ? "Nenhuma competência relacionada."
          : `${value.length} ${value.length === 1 ? "competência relacionada" : "competências relacionadas"}.`}
      </div>

      {value.length > 0 ? (
        <ul
          aria-label="Competências relacionadas ao curso"
          className="flex list-none flex-wrap gap-2 p-0"
        >
          {value.map((skill, index) => (
            <li
              key={skill.id}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-muted py-1 pr-1 pl-3 text-base text-foreground"
            >
              <span className="break-words">{skill.name}</span>
              <Button
                ref={(element: HTMLButtonElement | null) => {
                  if (element) removeButtons.current.set(skill.id, element);
                  else removeButtons.current.delete(skill.id);
                }}
                type="button"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remover ${skill.name}`}
                onClick={() => remove(skill, index)}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {options.isPending ? (
        <p role="status" className="text-base text-muted-foreground">
          Carregando competências…
        </p>
      ) : options.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-base text-destructive">
            {skillOptionsErrorMessage()}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void options.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : options.data.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {debouncedSearch === ""
            ? "O catálogo não tem competências ativas."
            : `Nenhuma competência ativa encontrada para “${debouncedSearch}”.`}
        </p>
      ) : (
        <fieldset className="min-w-0 space-y-1" disabled={disabled}>
          <legend className="text-base leading-none font-medium">
            Competências encontradas
          </legend>
          <ul className="max-h-56 list-none overflow-y-auto rounded-lg border border-border p-2">
            {options.data.map((skill) => {
              const checked = selectedIds.has(skill.id);
              return (
                <li key={skill.id}>
                  <label className="flex min-h-11 items-center gap-3 text-lg">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={checked}
                      disabled={!checked && limitReached}
                      onChange={() => toggle(skill)}
                    />
                    <span className="break-words">
                      {skill.name}{" "}
                      <span className="text-base text-muted-foreground">
                        ({skillTypeLabels[skill.type]})
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {limitReached ? (
        <p className="text-base text-muted-foreground">
          Limite de {TRAINING_MAX_SKILLS} competências por curso atingido.
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
