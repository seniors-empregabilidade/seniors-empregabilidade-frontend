import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { profileErrorMessage } from "./professional-profile-errors";
import { professionalProfileQueryKey } from "./professional-profile";
import type { ProfessionalProfile } from "./professional-profile-schema";
import {
  professionalProfileUpdateSchema,
  type ProfessionalProfileUpdateValues,
} from "./professional-profile-update-schema";
import { updateProfessionalProfile } from "./professional-profile-update";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfessionalProfile;
}

function defaultValuesFrom(
  profile: ProfessionalProfile,
): ProfessionalProfileUpdateValues {
  return {
    full_name: profile.full_name,
    phone: profile.phone,
    city: profile.city ?? "",
    state: profile.state ?? "",
    summary: profile.summary ?? "",
  };
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
}: EditProfileModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessionalProfileUpdateValues>({
    resolver: zodResolver(professionalProfileUpdateSchema),
    defaultValues: defaultValuesFrom(profile),
  });

  const mutation = useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(professionalProfileQueryKey, updated);
      onOpenChange(false);
    },
  });

  // Reafirma os valores atuais e limpa um erro anterior toda vez que o
  // modal abre, pra não mostrar uma edição/erro descartado caso o usuário
  // reabra sem ter salvo. `mutation.reset` muda de identidade a cada
  // render, então fica de fora das deps de propósito (senão o efeito
  // rodaria a cada render).
  useEffect(() => {
    if (open) {
      reset(defaultValuesFrom(profile));
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile, reset]);

  function onSubmit(values: ProfessionalProfileUpdateValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar perfil</DialogTitle>
          <Separator />
        </DialogHeader>

        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          {mutation.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-lg text-destructive"
            >
              {profileErrorMessage(mutation.error)}
            </p>
          ) : null}

          <PhotoField />

          <Field>
            <FieldLabel htmlFor="full_name">Nome completo</FieldLabel>
            <Input
              id="full_name"
              aria-invalid={errors.full_name ? true : undefined}
              aria-describedby={
                errors.full_name ? "full_name-error" : undefined
              }
              {...register("full_name")}
            />
            <FieldError id="full_name-error" errors={[errors.full_name]} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[116px_minmax(0,1fr)_170px]">
            <Field>
              <FieldLabel htmlFor="age">Idade</FieldLabel>
              <Input
                id="age"
                value={`${profile.age} anos`}
                disabled
                aria-label="Idade — calculada automaticamente, não é editável"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" value={profile.email} disabled />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Telefone</FieldLabel>
              <Input
                id="phone"
                type="tel"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
              />
              <FieldError id="phone-error" errors={[errors.phone]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
            <Field>
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <Input
                id="city"
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={errors.city ? "city-error" : undefined}
                {...register("city")}
              />
              <FieldError id="city-error" errors={[errors.city]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="state">Estado</FieldLabel>
              <Input
                id="state"
                maxLength={2}
                className="uppercase"
                aria-invalid={errors.state ? true : undefined}
                aria-describedby={errors.state ? "state-error" : undefined}
                {...register("state")}
              />
              <FieldError id="state-error" errors={[errors.state]} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="summary">Resumo</FieldLabel>
            <Textarea
              id="summary"
              rows={4}
              aria-invalid={errors.summary ? true : undefined}
              aria-describedby={errors.summary ? "summary-error" : undefined}
              {...register("summary")}
            />
            <FieldError id="summary-error" errors={[errors.summary]} />
          </Field>

          <ExperienceFieldset experiences={profile.experiences} />
          <EducationFieldset education={profile.education} />
          <SkillsFieldset skills={profile.skills} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PhotoField() {
  return (
    <Field>
      <FieldLabel>Foto de perfil</FieldLabel>
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dashed border-input bg-accent/40 text-base text-foreground-2"
        >
          FOTO
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-fit shrink-0"
          aria-describedby="photo-upload-unavailable"
        >
          Enviar foto
        </Button>
        <FieldDescription>Opcional. JPG ou PNG de até 5 MB.</FieldDescription>
      </div>
      <UnavailableNote id="photo-upload-unavailable" />
    </Field>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-foreground">{children}</h3>;
}

function UnavailableNote({ id }: { id: string }) {
  return (
    <p id={id} className="mt-2 text-base text-muted-foreground">
      Disponível em breve.
    </p>
  );
}

function ExperienceFieldset({
  experiences,
}: {
  experiences: ProfessionalProfile["experiences"];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeading>Experiência</SectionHeading>
        <Button
          type="button"
          variant="outline"
          disabled
          aria-describedby="experience-unavailable"
        >
          Adicionar experiência
        </Button>
      </div>
      {experiences.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          Nenhuma experiência cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <p className="text-lg font-bold text-foreground">
                {exp.role} · {exp.company_name}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" disabled>
                  Editar
                </Button>
                <Button type="button" variant="outline" disabled>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <UnavailableNote id="experience-unavailable" />
    </div>
  );
}

function EducationFieldset({
  education,
}: {
  education: ProfessionalProfile["education"];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeading>Formação e certificação</SectionHeading>
        <Button
          type="button"
          variant="outline"
          disabled
          aria-describedby="education-unavailable"
        >
          Adicionar formação
        </Button>
      </div>
      {education.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          Nenhuma formação cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {education.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <p className="text-lg font-bold text-foreground">
                {item.degree || item.institution}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" disabled>
                  Editar
                </Button>
                <Button type="button" variant="outline" disabled>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <UnavailableNote id="education-unavailable" />
    </div>
  );
}

function SkillsFieldset({ skills }: { skills: ProfessionalProfile["skills"] }) {
  return (
    <div>
      <SectionHeading>Habilidades</SectionHeading>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-input p-3">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="rounded-full border border-border bg-accent px-3 py-1.5 text-base text-foreground"
          >
            {skill.name}
          </span>
        ))}
        <Input
          disabled
          placeholder="Digite e pressione Enter"
          aria-describedby="skills-unavailable"
          className="h-9 w-56 border-none px-2 shadow-none focus-visible:ring-0"
        />
      </div>
      <p
        id="skills-unavailable"
        className="mt-2 text-base text-muted-foreground"
      >
        São estas habilidades que a vaga compara para dizer quantos requisitos
        você atende. A edição de habilidades estará disponível em breve.
      </p>
    </div>
  );
}
