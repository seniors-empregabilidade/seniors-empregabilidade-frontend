import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useId, useState } from "react";
import { type DefaultValues, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { skillTypeLabels, workModeLabels } from "./job-labels";
import {
  jobPostingSchema,
  type JobPostingValues,
  type JobSkill,
  MAX_SKILL_NAME_LENGTH,
  normalizeSkillName,
  type SkillType,
  skillTypes,
  todayIsoDate,
  workModes,
} from "./job-posting-schema";
import {
  createJob,
  type Job,
  MIN_SKILL_SEARCH_LENGTH,
  myJobsQueryKey,
  skillSuggestionsQueryOptions,
} from "./jobs-api";
import { jobPostingFailure } from "./jobs-errors";
import { useDebouncedValue } from "./use-debounced-value";

const defaults: DefaultValues<JobPostingValues> = {
  title: "",
  description: "",
  closingDate: "",
  skills: [],
};

const SUGGESTION_DELAY_MS = 300;

const choiceClassName = "flex min-h-11 items-center gap-2 text-lg";
const radioClassName = "size-5 shrink-0 accent-primary";

interface JobPostingModalProps {
  /** Runs only after the API confirmed the job, with the job it stored. */
  onPublished?: (job: Job) => void;
}

export function JobPostingModal({ onPublished }: JobPostingModalProps) {
  const [open, setOpen] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [skillType, setSkillType] = useState<SkillType>("hard");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const skillsInputId = useId();
  const skillTypeName = useId();
  const skillsSupportId = useId();
  const skillsErrorId = useId();
  const suggestionsLabelId = useId();
  const queryClient = useQueryClient();

  const form = useForm<JobPostingValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: defaults,
  });
  const {
    register,
    control,
    setValue,
    setError,
    formState,
    handleSubmit,
    reset,
  } = form;
  const { errors } = formState;
  const skills = useWatch({ control, name: "skills" }) ?? [];
  const addedNames = new Set(
    skills.map((skill) => normalizeSkillName(skill.name)),
  );

  const search = useDebouncedValue(skillDraft.trim(), SUGGESTION_DELAY_MS);
  const suggestions = useQuery(skillSuggestionsQueryOptions(search));
  // The previous suggestions stay cached while typing; once the field is
  // cleared they no longer describe what is being typed.
  const catalogMatches =
    skillDraft.trim().length >= MIN_SKILL_SEARCH_LENGTH
      ? (suggestions.data ?? []).filter(
          (skill) => !addedNames.has(normalizeSkillName(skill.name)),
        )
      : [];

  const mutation = useMutation({
    mutationFn: createJob,
    retry: false,
    gcTime: 0,
    // Whatever the outcome, the list shows what the server stored: a request
    // that timed out may still have been committed.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: myJobsQueryKey }),
  });
  const busy = mutation.isPending || formState.isSubmitting;

  function resetModalState() {
    setGeneralError(null);
    setSkillDraft("");
    setSkillType("hard");
    reset(defaults);
  }

  function addSkill(skill: JobSkill) {
    if (!addedNames.has(normalizeSkillName(skill.name))) {
      setValue("skills", [...skills, skill], { shouldValidate: true });
    }
    setSkillDraft("");
  }

  function addTypedSkill() {
    const name = skillDraft.trim().split(/\s+/).join(" ");
    if (!name) return;

    const normalized = normalizeSkillName(name);
    if (!normalized) {
      setError("skills", {
        type: "manual",
        message: "Digite uma habilidade com letras ou números.",
      });
      return;
    }

    // A name the catalog already has keeps its stored spelling and type.
    const known = suggestions.data?.find(
      (skill) => normalizeSkillName(skill.name) === normalized,
    );
    addSkill(
      known
        ? { name: known.name, type: known.type }
        : { name, type: skillType },
    );
  }

  function removeSkill(name: string) {
    setValue(
      "skills",
      skills.filter((skill) => skill.name !== name),
      { shouldValidate: true },
    );
  }

  async function submit(values: JobPostingValues) {
    setGeneralError(null);
    try {
      const job = await mutation.mutateAsync(values);
      resetModalState();
      setOpen(false);
      onPublished?.(job);
    } catch (error) {
      const failure = jobPostingFailure(error);
      setGeneralError(failure.message);
      for (const { field, message } of failure.fields) {
        setError(field, { type: "server", message });
      }
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-request would hide whether the job was published.
        if (!nextOpen && busy) return;
        setOpen(nextOpen);
        if (!nextOpen) resetModalState();
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
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(submit)(event);
          }}
          className="space-y-6"
          aria-busy={busy}
        >
          <fieldset disabled={busy} className="min-w-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="job-title">Título da vaga *</Label>
              <Input
                {...register("title")}
                id="job-title"
                aria-required="true"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "job-title-error" : undefined}
              />
              {errors.title && (
                <p
                  id="job-title-error"
                  role="alert"
                  className="text-destructive"
                >
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Descrição da vaga *</Label>
              <textarea
                {...register("description")}
                id="job-description"
                rows={5}
                aria-required="true"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "job-description-error" : undefined
                }
                className="w-full min-w-0 rounded-md border-[1.5px] border-input bg-transparent px-3.5 py-2 text-lg transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-2 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              />
              {errors.description && (
                <p
                  id="job-description-error"
                  role="alert"
                  className="text-destructive"
                >
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <fieldset
                className="min-w-0"
                aria-describedby={
                  errors.workMode ? "job-work-mode-error" : undefined
                }
              >
                <legend className="text-base leading-none font-medium">
                  Modalidade de trabalho *
                </legend>
                <div className="flex flex-wrap gap-x-6">
                  {workModes.map((mode) => (
                    <label key={mode} className={choiceClassName}>
                      <input
                        {...register("workMode")}
                        type="radio"
                        value={mode}
                        className={radioClassName}
                      />
                      {workModeLabels[mode]}
                    </label>
                  ))}
                </div>
                {errors.workMode && (
                  <p
                    id="job-work-mode-error"
                    role="alert"
                    className="text-destructive"
                  >
                    {errors.workMode.message}
                  </p>
                )}
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="job-closing-date">Data de encerramento *</Label>
                <Input
                  {...register("closingDate")}
                  id="job-closing-date"
                  type="date"
                  min={todayIsoDate()}
                  aria-required="true"
                  aria-invalid={Boolean(errors.closingDate)}
                  aria-describedby={
                    errors.closingDate ? "job-closing-date-error" : undefined
                  }
                />
                {errors.closingDate && (
                  <p
                    id="job-closing-date-error"
                    role="alert"
                    className="text-destructive"
                  >
                    {errors.closingDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor={skillsInputId}>Habilidades necessárias *</Label>
              <div className="flex gap-2">
                <Input
                  id={skillsInputId}
                  value={skillDraft}
                  maxLength={MAX_SKILL_NAME_LENGTH}
                  autoComplete="off"
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTypedSkill();
                    }
                  }}
                  placeholder="Ex.: Atendimento ao cliente"
                  aria-invalid={Boolean(errors.skills)}
                  aria-describedby={
                    errors.skills?.message
                      ? `${skillsSupportId} ${skillsErrorId}`
                      : skillsSupportId
                  }
                />
                <Button type="button" variant="outline" onClick={addTypedSkill}>
                  Adicionar
                </Button>
              </div>

              <fieldset className="min-w-0">
                <legend className="text-base leading-none font-medium">
                  Tipo da habilidade digitada
                </legend>
                <div className="flex flex-wrap gap-x-6">
                  {skillTypes.map((type) => (
                    <label key={type} className={choiceClassName}>
                      <input
                        type="radio"
                        name={skillTypeName}
                        value={type}
                        checked={skillType === type}
                        onChange={() => setSkillType(type)}
                        className={radioClassName}
                      />
                      {skillTypeLabels[type]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {catalogMatches.length > 0 && (
                <div className="space-y-2">
                  <p
                    id={suggestionsLabelId}
                    className="text-base text-muted-foreground"
                  >
                    Sugestões do catálogo
                  </p>
                  <ul
                    aria-labelledby={suggestionsLabelId}
                    className="flex flex-wrap gap-2"
                  >
                    {catalogMatches.map((skill) => (
                      <li key={skill.id}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addSkill({ name: skill.name, type: skill.type })
                          }
                          aria-label={`Adicionar ${skill.name} (${skillTypeLabels[skill.type]})`}
                        >
                          {skill.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skills.length > 0 && (
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label="Habilidades adicionadas"
                >
                  {skills.map((skill) => (
                    <li
                      key={normalizeSkillName(skill.name)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-accent py-1 pr-1 pl-3 text-base text-foreground"
                    >
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">
                        · {skillTypeLabels[skill.type]}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.name)}
                        aria-label={`Remover habilidade ${skill.name}`}
                        className="inline-flex size-8 items-center justify-center rounded-full outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <XIcon className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p id={skillsSupportId} className="text-muted-foreground">
                Escolha uma sugestão ou digite a habilidade, marque o tipo e
                pressione Enter ou “Adicionar”. As habilidades definem o cálculo
                de compatibilidade mostrado ao candidato.
              </p>
              {errors.skills?.message && (
                <p id={skillsErrorId} role="alert" className="text-destructive">
                  {errors.skills.message}
                </p>
              )}
            </div>
          </fieldset>

          {generalError && (
            <p role="alert" className="text-destructive">
              {generalError}
            </p>
          )}

          <DialogFooter>
            <DialogClose
              disabled={busy}
              render={
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Publicando…" : "Publicar vaga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
