import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { professionalProfileQueryOptions } from "./professional-profile";
import { profileErrorMessage } from "./professional-profile-errors";
import { formatExperiencePeriod, getYear } from "./profile-date-utils";
import type {
  Education,
  Experience,
  ProfessionalProfile,
  Skill,
} from "./professional-profile-schema";

interface ProfileViewProps {
  /**
   * Abre o modal de edição de perfil (US-09-T03). Ainda não existe:
   * enquanto não for passado, o botão "Editar perfil" fica desabilitado.
   */
  onEditProfile?: () => void;
}

export function ProfileView({ onEditProfile }: ProfileViewProps) {
  const {
    data: profile,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(professionalProfileQueryOptions);

  // isPending cobre tanto "carregando" quanto "sem dados ainda porque a
  // query está pausada" (ex.: offline, com networkMode padrão) — usar
  // isLoading aqui deixava a tela em branco nesse segundo caso.
  if (isPending) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return (
      <ProfileErrorState
        message={profileErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <main className="min-h-full bg-muted p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold text-foreground">Meu perfil</h1>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            onClick={onEditProfile}
            disabled={!onEditProfile}
            aria-describedby={
              !onEditProfile ? "edit-profile-unavailable" : undefined
            }
          >
            Editar perfil
          </Button>
          {!onEditProfile ? (
            <span
              id="edit-profile-unavailable"
              className="text-base text-muted-foreground"
            >
              Disponível em breve
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Coluna principal */}
        <div className="flex flex-2 flex-col gap-6">
          <section className="rounded-lg border border-border bg-background p-6">
            <ProfileHeader profile={profile} />
            <hr className="my-6 border-rule" />
            <SummarySection summary={profile.summary} />
            <hr className="my-6 border-rule" />
            <ExperienceSection experiences={profile.experiences} />
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-1 flex-col gap-6">
          <section className="rounded-lg border border-border bg-background p-6">
            <EducationSection education={profile.education} />
          </section>
          <section className="rounded-lg border border-border bg-background p-6">
            <SkillsSection skills={profile.skills} />
          </section>
        </div>
      </div>
    </main>
  );
}

type ProfileHeaderData = Pick<
  ProfessionalProfile,
  "full_name" | "age" | "email" | "city" | "state" | "photo_url"
>;

function ProfileHeader({ profile }: { profile: ProfileHeaderData }) {
  const location = formatLocation(profile.city, profile.state);

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div
        aria-hidden={!profile.photo_url ? true : undefined}
        className="flex h-26 w-26 shrink-0 items-center justify-center rounded-full bg-accent text-base text-foreground-2"
      >
        {profile.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.full_name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          "FOTO"
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 break-words">
        <h2 className="text-[26px] font-bold text-foreground">
          {profile.full_name}
        </h2>
        <p className="text-lg text-foreground-2">
          <strong>Idade:</strong> {profile.age} anos
        </p>
        <p className="text-lg text-foreground-2">
          <strong>E-mail:</strong> {profile.email}
        </p>
        {location ? (
          <p className="text-lg text-foreground-2">
            <strong>Cidade:</strong> {location}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatLocation(
  city: string | null,
  state: string | null,
): string | null {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return null;
}

function SummarySection({ summary }: { summary: string | null }) {
  return (
    <div>
      <SectionTitle>Resumo</SectionTitle>
      {summary ? (
        <p className="text-lg text-foreground">{summary}</p>
      ) : (
        <EmptyState message="Nenhum resumo cadastrado ainda." />
      )}
    </div>
  );
}

function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  return (
    <div>
      <SectionTitle>Experiência</SectionTitle>
      {experiences.length === 0 ? (
        <EmptyState message="Nenhuma experiência cadastrada ainda." />
      ) : (
        <div className="flex flex-col gap-5">
          {experiences.map((exp) => (
            <ExperienceItem key={exp.id} experience={exp} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceItem({ experience }: { experience: Experience }) {
  const period = formatExperiencePeriod(
    experience.start_date,
    experience.end_date,
  );
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <div className="sm:min-w-24">
        <p className="text-base text-muted-foreground">{period.label}</p>
        <p className="text-base text-muted-foreground">{period.duration}</p>
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">
          {experience.role} · {experience.company_name}
        </p>
        {experience.description ? (
          <p className="text-lg text-foreground">{experience.description}</p>
        ) : null}
      </div>
    </div>
  );
}

function EducationSection({ education }: { education: Education[] }) {
  return (
    <div>
      <SectionTitle>Formação e certificação</SectionTitle>
      {education.length === 0 ? (
        <EmptyState message="Nenhuma formação cadastrada ainda." />
      ) : (
        <div className="flex flex-col gap-4">
          {education.map((item) => (
            <EducationItem key={item.id} education={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EducationItem({ education }: { education: Education }) {
  const title = [education.degree, education.field]
    .filter(Boolean)
    .join(" em ");
  const dateForYear = education.end_date ?? education.start_date;
  const year = dateForYear ? getYear(dateForYear) : null;

  return (
    <div>
      <p className="text-lg font-bold text-foreground">
        {title || education.institution}
      </p>
      <p className="text-base text-muted-foreground">
        {title ? education.institution : null}
        {title && year ? " · " : null}
        {year}
      </p>
    </div>
  );
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  return (
    <div>
      <SectionTitle>Habilidades</SectionTitle>
      {skills.length === 0 ? (
        <EmptyState message="Nenhuma habilidade cadastrada ainda." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full border border-border bg-accent px-3 py-1.5 text-base text-foreground"
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xl font-bold text-foreground">{children}</h3>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-lg text-muted-foreground">{message}</p>;
}

function ProfileSkeleton() {
  return (
    <main className="min-h-full animate-pulse bg-muted p-8 motion-reduce:animate-none">
      <div className="mb-8 flex items-center gap-6">
        <div className="h-26 w-26 rounded-full bg-accent" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-8 w-1/3 rounded bg-accent" />
          <div className="h-4 w-1/5 rounded bg-accent" />
          <div className="h-4 w-2/5 rounded bg-accent" />
        </div>
      </div>
      <div className="mb-4 h-30 rounded-lg bg-accent" />
      <div className="h-50 rounded-lg bg-accent" />
    </main>
  );
}

function ProfileErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-full items-center justify-center bg-muted p-8">
      <div
        role="alert"
        className="flex max-w-md flex-col gap-4 rounded-lg border border-destructive bg-background p-6"
      >
        <span className="font-mono text-[13px] font-semibold tracking-wide text-destructive uppercase">
          Erro
        </span>
        <p className="text-lg text-foreground">{message}</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
