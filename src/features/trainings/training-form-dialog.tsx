import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { Controller, type DefaultValues, useForm } from "react-hook-form";

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
import { ApiError } from "@/lib/api-error";

import { TrainingSkillPicker } from "./training-skill-picker";
import {
  type AdminTraining,
  adminTrainingsQueryKey,
  createTraining,
  TRAINING_INSTITUTION_MAX_LENGTH,
  TRAINING_LINK_MAX_LENGTH,
  TRAINING_TITLE_MAX_LENGTH,
  trainingModeLabels,
  trainingModes,
  trainingSaveErrorMessage,
  type TrainingValues,
  trainingValuesSchema,
  updateTraining,
} from "./trainings-admin-api";

const choiceClassName = "flex min-h-11 items-center gap-2 text-lg";
const radioClassName = "size-5 shrink-0 accent-primary";

interface TrainingFormDialogProps {
  /** The course to edit; without it the dialog adds a new one. */
  training?: AdminTraining;
  onSaved: (message: string) => void;
}

// A new course starts without a mode so the administrator picks it on
// purpose, and unpublished so nothing reaches candidates by accident.
function initialValues(
  training?: AdminTraining,
): DefaultValues<TrainingValues> {
  if (!training) {
    return {
      title: "",
      institution: "",
      external_link: "",
      published: false,
      skills: [],
    };
  }
  return {
    title: training.title,
    institution: training.institution ?? "",
    ...(training.mode ? { mode: training.mode } : {}),
    external_link: training.external_link,
    published: training.published,
    skills: training.skills,
  };
}

function isRelationNotFound(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === "training_relation_not_found"
  );
}

export function TrainingFormDialog({
  training,
  onSaved,
}: TrainingFormDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const uid = useId();
  const ids = {
    title: `${uid}-title`,
    titleError: `${uid}-title-error`,
    institution: `${uid}-institution`,
    institutionError: `${uid}-institution-error`,
    modeError: `${uid}-mode-error`,
    link: `${uid}-link`,
    linkHint: `${uid}-link-hint`,
    linkError: `${uid}-link-error`,
    publishedHint: `${uid}-published-hint`,
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingValues>({
    resolver: zodResolver(trainingValuesSchema),
    defaultValues: initialValues(training),
  });
  const mutation = useMutation({
    mutationFn: (values: TrainingValues) =>
      training ? updateTraining(training.id, values) : createTraining(values),
    onSuccess: async (saved) => {
      setOpen(false);
      onSaved(
        training
          ? `Curso “${saved.title}” atualizado.`
          : `Curso “${saved.title}” cadastrado.`,
      );
      await queryClient.invalidateQueries({ queryKey: adminTrainingsQueryKey });
    },
  });
  const pending = mutation.isPending;
  const relationProblem =
    mutation.isError && isRelationNotFound(mutation.error)
      ? trainingSaveErrorMessage(mutation.error)
      : undefined;
  const failure =
    mutation.isError && !relationProblem
      ? trainingSaveErrorMessage(mutation.error)
      : null;
  const titleProblem = errors.title?.message;
  const institutionProblem = errors.institution?.message;
  const modeProblem = errors.mode?.message;
  const linkProblem = errors.external_link?.message;
  const skillsProblem = errors.skills?.message ?? relationProblem;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        if (nextOpen) {
          // Each opening starts from the stored course, not from a draft
          // that was cancelled earlier.
          reset(initialValues(training));
          mutation.reset();
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          training ? (
            <Button
              type="button"
              variant="outline"
              aria-label={`Editar ${training.title}`}
            >
              Editar
            </Button>
          ) : (
            <Button type="button">Novo curso</Button>
          )
        }
      />
      <DialogContent
        showCloseButton={!pending}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{training ? "Editar curso" : "Novo curso"}</DialogTitle>
          <DialogDescription>
            {training
              ? "As alterações valem para a busca de cursos dos candidatos, se o curso estiver publicado."
              : "O curso só aparece para os candidatos depois de publicado."}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-6"
          onSubmit={(event) => {
            void handleSubmit((values) => mutation.mutate(values))(event);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={ids.title}>Nome do curso *</Label>
            <Input
              {...register("title")}
              id={ids.title}
              autoComplete="off"
              maxLength={TRAINING_TITLE_MAX_LENGTH}
              disabled={pending}
              aria-required="true"
              aria-invalid={Boolean(titleProblem)}
              aria-describedby={titleProblem ? ids.titleError : undefined}
            />
            {titleProblem ? (
              <p id={ids.titleError} role="alert" className="text-destructive">
                {titleProblem}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={ids.institution}>Instituição *</Label>
            <Input
              {...register("institution")}
              id={ids.institution}
              autoComplete="off"
              maxLength={TRAINING_INSTITUTION_MAX_LENGTH}
              disabled={pending}
              aria-required="true"
              aria-invalid={Boolean(institutionProblem)}
              aria-describedby={
                institutionProblem ? ids.institutionError : undefined
              }
            />
            {institutionProblem ? (
              <p
                id={ids.institutionError}
                role="alert"
                className="text-destructive"
              >
                {institutionProblem}
              </p>
            ) : null}
          </div>

          <fieldset
            className="min-w-0 space-y-2"
            aria-describedby={modeProblem ? ids.modeError : undefined}
          >
            <legend className="text-base leading-none font-medium">
              Modalidade *
            </legend>
            <div className="flex flex-wrap gap-x-6">
              {trainingModes.map((mode) => (
                <label key={mode} className={choiceClassName}>
                  <input
                    {...register("mode")}
                    type="radio"
                    value={mode}
                    disabled={pending}
                    className={radioClassName}
                  />
                  {trainingModeLabels[mode]}
                </label>
              ))}
            </div>
            {modeProblem ? (
              <p id={ids.modeError} role="alert" className="text-destructive">
                {modeProblem}
              </p>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor={ids.link}>Link do curso *</Label>
            <p id={ids.linkHint} className="text-base text-muted-foreground">
              Endereço completo da página do curso, como https://exemplo.com.br.
            </p>
            <Input
              {...register("external_link")}
              id={ids.link}
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={TRAINING_LINK_MAX_LENGTH}
              disabled={pending}
              aria-required="true"
              aria-invalid={Boolean(linkProblem)}
              aria-describedby={
                linkProblem ? `${ids.linkHint} ${ids.linkError}` : ids.linkHint
              }
            />
            {linkProblem ? (
              <p id={ids.linkError} role="alert" className="text-destructive">
                {linkProblem}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <TrainingSkillPicker
                value={field.value}
                onChange={field.onChange}
                disabled={pending}
                errorMessage={skillsProblem}
              />
            )}
          />

          {training && training.job_ids.length > 0 ? (
            <p className="text-base text-muted-foreground">
              Este curso está relacionado a {training.job_ids.length}{" "}
              {training.job_ids.length === 1 ? "vaga" : "vagas"}. As relações
              com vagas são mantidas ao salvar.
            </p>
          ) : null}

          <div className="space-y-1">
            <label className={choiceClassName}>
              <input
                {...register("published")}
                type="checkbox"
                disabled={pending}
                aria-describedby={ids.publishedHint}
                className={radioClassName}
              />
              Publicar para os candidatos
            </label>
            <p
              id={ids.publishedHint}
              className="text-base text-muted-foreground"
            >
              Cursos não publicados ficam inativos: somem da busca dos
              candidatos, mas continuam aqui e podem ser publicados depois.
            </p>
          </div>

          {failure ? (
            <p role="alert" className="text-destructive">
              {failure}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose
              disabled={pending}
              render={
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={pending}>
              {pending
                ? "Salvando…"
                : training
                  ? "Salvar alterações"
                  : "Cadastrar curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
