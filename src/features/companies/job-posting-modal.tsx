import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
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

import { createJobPosting } from "./job-postings-api";
import { jobPostingSchema, type JobPostingValues } from "./job-posting-schema";

const defaults: JobPostingValues = {
  title: "",
  description: "",
  skills: [],
};

export function JobPostingModal() {
  const [open, setOpen] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const skillsInputId = useId();
  const skillsSupportId = useId();
  const skillsErrorId = useId();

  const form = useForm<JobPostingValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: defaults,
  });
  const {
    register,
    control,
    setValue,
    setError,
    clearErrors,
    formState,
    handleSubmit,
    reset,
  } = form;
  const skills = useWatch({ control, name: "skills" }) ?? [];

  const mutation = useMutation({
    mutationFn: createJobPosting,
    retry: false,
    gcTime: 0,
  });
  const busy = mutation.isPending || formState.isSubmitting;

  function resetModalState() {
    setGeneralError(null);
    setSkillDraft("");
    reset(defaults);
  }

  function addSkill() {
    const value = skillDraft.trim();
    if (!value) return;
    if (skills.includes(value)) {
      setSkillDraft("");
      return;
    }
    setValue("skills", [...skills, value], { shouldValidate: true });
    clearErrors("skills");
    setSkillDraft("");
  }

  function removeSkill(skill: string) {
    setValue(
      "skills",
      skills.filter((item) => item !== skill),
      { shouldValidate: true },
    );
  }

  async function submit(values: JobPostingValues) {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
      resetModalState();
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setGeneralError(error.message);
        if (error.code === "validation_error" && error.errors) {
          for (const key of Object.keys(error.errors)) {
            if (key === "title" || key === "description" || key === "skills") {
              setError(key, {
                type: "server",
                message: "Confira o valor deste campo.",
              });
            }
          }
        }
      } else {
        setGeneralError("Não foi possível publicar a vaga. Tente novamente.");
      }
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetModalState();
      }}
    >
      <DialogTrigger render={<Button>Cadastrar nova vaga</Button>} />
      <DialogContent>
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
          <fieldset disabled={busy} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="job-title">Título da vaga *</Label>
              <Input
                {...register("title")}
                id="job-title"
                aria-required="true"
                aria-invalid={Boolean(formState.errors.title)}
                aria-describedby={
                  formState.errors.title ? "job-title-error" : undefined
                }
              />
              {formState.errors.title && (
                <p
                  id="job-title-error"
                  role="alert"
                  className="text-destructive"
                >
                  {formState.errors.title.message}
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
                aria-invalid={Boolean(formState.errors.description)}
                aria-describedby={
                  formState.errors.description
                    ? "job-description-error"
                    : undefined
                }
                className="w-full min-w-0 rounded-md border-[1.5px] border-input bg-transparent px-3.5 py-2 text-lg transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-2 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              />
              {formState.errors.description && (
                <p
                  id="job-description-error"
                  role="alert"
                  className="text-destructive"
                >
                  {formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={skillsInputId}>Habilidades necessárias *</Label>
              <Input
                id={skillsInputId}
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Digite e pressione Enter"
                aria-invalid={Boolean(formState.errors.skills)}
                aria-describedby={`${skillsSupportId} ${skillsErrorId}`}
              />
              {skills.length > 0 && (
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label="Habilidades adicionadas"
                >
                  {skills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remover habilidade ${skill}`}
                          className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <XIcon className="size-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              <p id={skillsSupportId} className="text-muted-foreground">
                As habilidades definem o cálculo de compatibilidade mostrado ao
                candidato.
              </p>
              {formState.errors.skills && (
                <p id={skillsErrorId} role="alert" className="text-destructive">
                  {formState.errors.skills.message}
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
