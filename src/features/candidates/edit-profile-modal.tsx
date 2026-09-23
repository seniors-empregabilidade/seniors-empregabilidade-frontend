import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
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
import { CompanyBadge } from "@/components/ui/company-badge";
import { formatExperiencePeriod, getYear } from "./profile-date-utils";
import type {
  Education,
  Experience,
  ProfessionalProfile,
  Skill,
} from "./professional-profile-schema";
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

// IDs client-side pra itens novos (experiência/formação/habilidade) que
// ainda não existem no backend. Prefixo "local-" deixa óbvio, pra quem for
// integrar, que esses IDs não devem ser mandados como se fossem reais.
let localIdCounter = 0;
function createLocalId(): string {
  localIdCounter += 1;
  return `local-${Date.now()}-${localIdCounter}`;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
}: EditProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar perfil</DialogTitle>
          <Separator />
        </DialogHeader>

        {/* Só renderiza (e monta) o formulário quando o modal está
            aberto. Isso faz o React criar uma instância nova — com todo
            o estado local (react-hook-form, experiências, etc.) fresco —
            toda vez que ele abre, sem precisar de um efeito pra "resetar"
            nada (o que o ESLint não deixa fazer chamando setState direto
            dentro de um effect) e sem precisar mexer em quem usa esse
            componente (o ProfileView não muda nada). */}
        {open ? (
          <EditProfileForm profile={profile} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditProfileForm({
  profile,
  onOpenChange,
}: {
  profile: ProfessionalProfile;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessionalProfileUpdateValues>({
    resolver: zodResolver(professionalProfileUpdateSchema),
    defaultValues: defaultValuesFrom(profile),
  });

  // Experiência, formação, habilidades e foto ainda não têm endpoint no
  // backend (só o GET e o PATCH dos 5 campos abaixo existem). Ficam em
  // estado local só pra tela ser funcional de ponta a ponta no front —
  // quem for integrar troca esses `set...` por chamadas reais de API.
  const [experiences, setExperiences] = useState<Experience[]>(
    profile.experiences,
  );
  const [education, setEducation] = useState<Education[]>(profile.education);
  const [skills, setSkills] = useState<Skill[]>(profile.skills);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(
    profile.photo_url ?? null,
  );
  const [justSaved, setJustSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: (updated) => {
      // O backend só devolve os 5 campos do formulário atualizados. Pra
      // você conseguir VER como a tela fica com experiência/formação/
      // habilidade/foto — mesmo sem existir endpoint pra salvar isso de
      // verdade ainda —, mesclamos aqui o que já veio do servidor com o
      // que ficou em estado local. TODO: quando os endpoints existirem,
      // isso deixa de ser necessário (o `updated` já vem completo).
      queryClient.setQueryData(professionalProfileQueryKey, {
        ...updated,
        experiences,
        education,
        skills,
        photo_url: photoPreviewUrl,
      });
      // Feedback explícito de sucesso (pedido pela task), não só o
      // fechamento silencioso do modal: mostra a confirmação por um
      // instante antes de fechar, dando tempo de ser percebida (inclusive
      // por leitor de tela, via role="status").
      setJustSaved(true);
      window.setTimeout(() => onOpenChange(false), 900);
    },
  });

  function onSubmit(values: ProfessionalProfileUpdateValues) {
    mutation.mutate(values);
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      {justSaved ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-lg text-success"
        >
          Perfil atualizado com sucesso.
        </p>
      ) : null}
      {mutation.isError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-lg text-destructive"
        >
          {profileErrorMessage(mutation.error)}
        </p>
      ) : null}

      <PhotoField
        previewUrl={photoPreviewUrl}
        onPhotoSelected={setPhotoPreviewUrl}
      />

      <Field>
        <FieldLabel htmlFor="full_name">Nome completo</FieldLabel>
        <Input
          id="full_name"
          aria-invalid={errors.full_name ? true : undefined}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
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

      <ExperienceFieldset experiences={experiences} onChange={setExperiences} />
      <EducationFieldset education={education} onChange={setEducation} />
      <SkillsFieldset skills={skills} onChange={setSkills} />

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
  );
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];

function PhotoField({
  previewUrl,
  onPhotoSelected,
}: {
  previewUrl: string | null;
  onPhotoSelected: (url: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo depois

    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Envie um arquivo JPG ou PNG.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setError("O arquivo não pode passar de 5 MB.");
      return;
    }

    setError(null);
    // TODO: quando o upload de foto tiver endpoint, trocar isso por um
    // envio de verdade (ex.: multipart/form-data) — por enquanto só mostra
    // a prévia local da imagem escolhida.
    onPhotoSelected(URL.createObjectURL(file));
  }

  return (
    <Field>
      <FieldLabel>Foto de perfil</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="h-18 w-18 shrink-0 overflow-hidden rounded-full border border-dashed border-input bg-accent/40">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center text-base text-foreground-2"
            >
              FOTO
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-fit shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          Enviar foto
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          aria-label="Selecionar foto de perfil"
          onChange={handleFileChange}
        />
        <FieldDescription>Opcional. JPG ou PNG de até 5 MB.</FieldDescription>
      </div>
      {error ? (
        <p role="alert" className="text-base text-destructive">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-foreground">{children}</h3>;
}

// ---------- Experiência ----------

interface ExperienceDraft {
  role: string;
  company_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

function draftFromExperience(exp?: Experience): ExperienceDraft {
  return {
    role: exp?.role ?? "",
    company_name: exp?.company_name ?? "",
    start_date: exp?.start_date ?? "",
    end_date: exp?.end_date ?? "",
    description: exp?.description ?? "",
  };
}

function ExperienceFieldset({
  experiences,
  onChange,
}: {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExperienceDraft>(draftFromExperience());

  function startAdd() {
    const id = createLocalId();
    setDraft(draftFromExperience());
    setEditingId(id);
    onChange([
      ...experiences,
      {
        id,
        role: "",
        company_name: "",
        start_date: "",
        end_date: null,
        description: null,
      },
    ]);
  }

  function startEdit(exp: Experience) {
    setDraft(draftFromExperience(exp));
    setEditingId(exp.id);
  }

  function cancelEdit(id: string, isNew: boolean) {
    setEditingId(null);
    if (isNew) {
      onChange(experiences.filter((exp) => exp.id !== id));
    }
  }

  function saveEdit(id: string) {
    onChange(
      experiences.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              role: draft.role,
              company_name: draft.company_name,
              start_date: draft.start_date,
              end_date: draft.end_date || null,
              description: draft.description || null,
            }
          : exp,
      ),
    );
    setEditingId(null);
  }

  function remove(id: string) {
    onChange(experiences.filter((exp) => exp.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeading>Experiência</SectionHeading>
        <Button type="button" variant="outline" onClick={startAdd}>
          Adicionar experiência
        </Button>
      </div>
      {experiences.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          Nenhuma experiência cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {experiences.map((exp) => {
            const period = exp.start_date
              ? formatExperiencePeriod(exp.start_date, exp.end_date)
              : null;
            return editingId === exp.id ? (
              <div
                key={exp.id}
                className="flex flex-col gap-3 rounded-lg border border-ring p-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`exp-role-${exp.id}`}>
                      Cargo
                    </FieldLabel>
                    <Input
                      id={`exp-role-${exp.id}`}
                      value={draft.role}
                      onChange={(event) =>
                        setDraft({ ...draft, role: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`exp-company-${exp.id}`}>
                      Empresa
                    </FieldLabel>
                    <Input
                      id={`exp-company-${exp.id}`}
                      value={draft.company_name}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          company_name: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`exp-start-${exp.id}`}>
                      Início
                    </FieldLabel>
                    <Input
                      id={`exp-start-${exp.id}`}
                      type="date"
                      value={draft.start_date}
                      onChange={(event) =>
                        setDraft({ ...draft, start_date: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`exp-end-${exp.id}`}>
                      Fim (deixe em branco se atual)
                    </FieldLabel>
                    <Input
                      id={`exp-end-${exp.id}`}
                      type="date"
                      value={draft.end_date}
                      onChange={(event) =>
                        setDraft({ ...draft, end_date: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`exp-desc-${exp.id}`}>
                    Descrição
                  </FieldLabel>
                  <Textarea
                    id={`exp-desc-${exp.id}`}
                    rows={3}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      cancelEdit(
                        exp.id,
                        exp.role === "" && exp.company_name === "",
                      )
                    }
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => saveEdit(exp.id)}>
                    Concluir
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <CompanyBadge companyName={exp.company_name} />
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {exp.role || "(sem cargo)"} · {exp.company_name || "—"}
                    </p>
                    {period ? (
                      <p className="text-base text-muted-foreground">
                        {period.label} · {period.duration}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEdit(exp)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(exp.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Formação ----------

interface EducationDraft {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
}

function draftFromEducation(item?: Education): EducationDraft {
  return {
    institution: item?.institution ?? "",
    degree: item?.degree ?? "",
    field: item?.field ?? "",
    start_date: item?.start_date ?? "",
    end_date: item?.end_date ?? "",
  };
}

function EducationFieldset({
  education,
  onChange,
}: {
  education: Education[];
  onChange: (education: Education[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EducationDraft>(draftFromEducation());

  function startAdd() {
    const id = createLocalId();
    setDraft(draftFromEducation());
    setEditingId(id);
    onChange([
      ...education,
      {
        id,
        institution: "",
        degree: null,
        field: null,
        start_date: null,
        end_date: null,
      },
    ]);
  }

  function startEdit(item: Education) {
    setDraft(draftFromEducation(item));
    setEditingId(item.id);
  }

  function cancelEdit(id: string, isNew: boolean) {
    setEditingId(null);
    if (isNew) {
      onChange(education.filter((item) => item.id !== id));
    }
  }

  function saveEdit(id: string) {
    onChange(
      education.map((item) =>
        item.id === id
          ? {
              ...item,
              institution: draft.institution,
              degree: draft.degree || null,
              field: draft.field || null,
              start_date: draft.start_date || null,
              end_date: draft.end_date || null,
            }
          : item,
      ),
    );
    setEditingId(null);
  }

  function remove(id: string) {
    onChange(education.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeading>Formação e certificação</SectionHeading>
        <Button type="button" variant="outline" onClick={startAdd}>
          Adicionar formação
        </Button>
      </div>
      {education.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          Nenhuma formação cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {education.map((item) => {
            const title = [item.degree, item.field]
              .filter(Boolean)
              .join(" em ");
            const dateForYear = item.end_date ?? item.start_date;
            const year = dateForYear ? getYear(dateForYear) : null;
            return editingId === item.id ? (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-ring p-4"
              >
                <Field>
                  <FieldLabel htmlFor={`edu-institution-${item.id}`}>
                    Instituição
                  </FieldLabel>
                  <Input
                    id={`edu-institution-${item.id}`}
                    value={draft.institution}
                    onChange={(event) =>
                      setDraft({ ...draft, institution: event.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`edu-degree-${item.id}`}>
                      Curso/grau (ex: MBA)
                    </FieldLabel>
                    <Input
                      id={`edu-degree-${item.id}`}
                      value={draft.degree}
                      onChange={(event) =>
                        setDraft({ ...draft, degree: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`edu-field-${item.id}`}>
                      Área
                    </FieldLabel>
                    <Input
                      id={`edu-field-${item.id}`}
                      value={draft.field}
                      onChange={(event) =>
                        setDraft({ ...draft, field: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`edu-start-${item.id}`}>
                      Início
                    </FieldLabel>
                    <Input
                      id={`edu-start-${item.id}`}
                      type="date"
                      value={draft.start_date}
                      onChange={(event) =>
                        setDraft({ ...draft, start_date: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`edu-end-${item.id}`}>
                      Conclusão
                    </FieldLabel>
                    <Input
                      id={`edu-end-${item.id}`}
                      type="date"
                      value={draft.end_date}
                      onChange={(event) =>
                        setDraft({ ...draft, end_date: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cancelEdit(item.id, item.institution === "")}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => saveEdit(item.id)}>
                    Concluir
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {title || item.institution || "(sem título)"}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {title ? item.institution : null}
                    {title && year ? " · " : null}
                    {year}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEdit(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(item.id)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Habilidades ----------

function SkillsFieldset({
  skills,
  onChange,
}: {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}) {
  const [draftName, setDraftName] = useState("");

  function addSkill() {
    const name = draftName.trim();
    if (!name) {
      return;
    }
    if (
      skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())
    ) {
      setDraftName("");
      return;
    }
    // TODO: quando o catálogo de habilidades (PR #25 do backend,
    // GET /api/v1/skills?search=) estiver integrado aqui, isso deixa de
    // criar texto livre e passa a escolher um item existente do catálogo
    // (com o `type` real vindo de lá, não um chute "soft").
    onChange([...skills, { id: createLocalId(), name, type: "soft" }]);
    setDraftName("");
  }

  function removeSkill(id: string) {
    onChange(skills.filter((skill) => skill.id !== id));
  }

  return (
    <div>
      <SectionHeading>Habilidades</SectionHeading>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-input p-3">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1.5 text-base text-foreground"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => removeSkill(skill.id)}
              aria-label={`Remover habilidade ${skill.name}`}
              className="rounded-full text-foreground-2 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill();
            }
          }}
          placeholder="Digite e pressione Enter"
          aria-label="Adicionar habilidade"
          className="h-9 w-56 border-none px-2 shadow-none focus-visible:ring-0"
        />
      </div>
      <p className="mt-2 text-base text-muted-foreground">
        São estas habilidades que a vaga compara para dizer quantos requisitos
        você atende.
      </p>
    </div>
  );
}
