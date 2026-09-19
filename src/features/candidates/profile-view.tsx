import { useQuery } from "@tanstack/react-query";

import { professionalProfileQueryOptions } from "./professional-profile";
import type {
  Education,
  Experience,
  ProfessionalProfile,
} from "./professional-profile-schema";

const TOKENS = {
  minTextSize: "text-[17px]",
  touchTarget: "min-h-[52px]",
};

interface ProfileViewProps {
  onEditProfile: () => void;
}

export function ProfileView({ onEditProfile }: ProfileViewProps) {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(professionalProfileQueryOptions);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return (
      <ProfileErrorState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seu perfil."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#F1F2EE] p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Meu perfil
        </h1>
        <button
          type="button"
          onClick={onEditProfile}
          className={`${TOKENS.touchTarget} rounded-md border border-[#1D5B8F] px-4 font-medium text-[#1D5B8F] hover:bg-[#1D5B8F]/5`}
        >
          Editar perfil
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-2 flex-col gap-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <ProfileHeader profile={profile} />
            <hr className="my-6 border-border" />
            <SummarySection summary={profile.summary} />
            <hr className="my-6 border-border" />
            <ExperienceSection experiences={profile.experiences} />
          </section>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <EducationSection education={profile.education} />
          </section>
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <SkillsSection skills={profile.skills} />
          </section>
        </div>
      </div>
    </div>
  );
}

type ProfileHeaderData = Pick<
  ProfessionalProfile,
  "full_name" | "age" | "email" | "city" | "state" | "photo_url"
>;

function ProfileHeader({ profile }: { profile: ProfileHeaderData }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex h-22 w-22 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
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
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-bold">{profile.full_name}</h2>
        <p className={TOKENS.minTextSize}>
          <strong>Idade:</strong> {profile.age} anos
        </p>
        <p className={TOKENS.minTextSize}>
          <strong>E-mail:</strong> {profile.email}
        </p>
        <p className={TOKENS.minTextSize}>
          <strong>Cidade:</strong> {profile.city}, {profile.state}
        </p>
      </div>
    </div>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <div>
      <SectionTitle>Resumo</SectionTitle>
      {summary ? (
        <p className={TOKENS.minTextSize}>{summary}</p>
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
  const period = formatPeriod(experience.start_date, experience.end_date);
  return (
    <div className="flex gap-4">
      <div className="min-w-24">
        <p className={`${TOKENS.minTextSize} text-muted-foreground`}>
          {period.label}
        </p>
        <p className={`${TOKENS.minTextSize} text-muted-foreground`}>
          {period.duration}
        </p>
      </div>
      <div>
        <p className={`${TOKENS.minTextSize} font-bold`}>
          {experience.role} · {experience.company}
        </p>
        <p className={TOKENS.minTextSize}>{experience.description}</p>
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
            <div key={item.id}>
              <p className={`${TOKENS.minTextSize} font-bold`}>{item.course}</p>
              <p className={`${TOKENS.minTextSize} text-muted-foreground`}>
                {item.institution} · {item.year}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <div>
      <SectionTitle>Habilidades</SectionTitle>
      {skills.length === 0 ? (
        <EmptyState message="Nenhuma habilidade cadastrada ainda." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-3 py-1.5 text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-lg font-bold">{children}</h3>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className={`${TOKENS.minTextSize} text-muted-foreground`}>{message}</p>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-full animate-pulse bg-[#F1F2EE] p-8">
      <div className="mb-8 flex items-center gap-6">
        <div className="h-22 w-22 rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/5 rounded bg-muted" />
          <div className="h-4 w-2/5 rounded bg-muted" />
        </div>
      </div>
      <div className="mb-4 h-30 rounded bg-muted" />
      <div className="h-50 rounded bg-muted" />
    </div>
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
    <div className="flex min-h-full items-center justify-center bg-[#F1F2EE] p-8">
      <div className="flex max-w-md items-center gap-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
        <p className={`${TOKENS.minTextSize} flex-1 text-destructive`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className={`${TOKENS.touchTarget} shrink-0 rounded-md border border-destructive px-3 text-sm font-medium text-destructive`}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function formatPeriod(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const startYear = start.getFullYear();
  const endYear = endDate ? end.getFullYear() : "atual";

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const years = Math.round(months / 12);

  return {
    label: `${startYear} – ${endYear}`,
    duration:
      years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "menos de 1 ano",
  };
}
