import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

import { safeExternalUrl } from "./safe-external-url";
import {
  courseSearchQueryOptions,
  SKILL_SEARCH_MAX_LENGTH,
  type Course,
  type CourseSearchPage,
  type TrainingMode,
} from "./trainings-api";

const SEARCH_DEBOUNCE_MS = 400;

const TRAINING_MODE_LABELS: Record<TrainingMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
  online: "Online",
};

export function CourseSearchView() {
  const searchId = useId();
  const [skill, setSkill] = useState("");
  const debouncedSkill = useDebouncedValue(skill.trim(), SEARCH_DEBOUNCE_MS);
  const courses = useQuery(courseSearchQueryOptions(debouncedSkill));

  return (
    <div className="min-h-full bg-muted p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Capacitação</h1>

      <div
        role="search"
        aria-label="Buscar cursos por habilidade"
        className="mb-6 max-w-xl space-y-2"
      >
        <Label htmlFor={searchId}>Buscar por habilidade</Label>
        <Input
          id={searchId}
          type="search"
          value={skill}
          maxLength={SKILL_SEARCH_MAX_LENGTH}
          autoComplete="off"
          placeholder="Ex.: NR-11, Excel, liderança"
          onChange={(event) => setSkill(event.target.value)}
        />
      </div>

      {courses.isPending ? (
        <CourseSearchLoading />
      ) : courses.isError ? (
        <CourseSearchError onRetry={() => void courses.refetch()} />
      ) : (
        <CourseSearchResults page={courses.data} skill={debouncedSkill} />
      )}
    </div>
  );
}

function CourseSearchResults({
  page,
  skill,
}: {
  page: CourseSearchPage;
  skill: string;
}) {
  const courses = page.items;

  return (
    <div>
      <p role="status" className="mb-4 text-lg text-foreground">
        <strong>{page.total}</strong> {courseCountLabel(page.total)}
        {skill === "" ? null : <> para “{skill}”</>}
        {/* Only the first page is loaded; say so instead of hiding the rest. */}
        {page.total > courses.length ? (
          <>. Mostrando os {courses.length} primeiros.</>
        ) : null}
      </p>

      {courses.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          {skill === ""
            ? "Nenhum curso disponível no momento."
            : `Nenhum curso encontrado para “${skill}”.`}
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function courseCountLabel(count: number): string {
  return count === 1 ? "curso encontrado" : "cursos encontrados";
}

function courseDetails(course: Course): string {
  const institution = course.institution?.trim() ?? "";
  return [
    institution === "" ? null : institution,
    course.mode === null ? null : TRAINING_MODE_LABELS[course.mode],
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

function CourseCard({ course }: { course: Course }) {
  const href = safeExternalUrl(course.external_link);
  const details = courseDetails(course);

  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-border bg-background p-6">
      <h2 className="text-xl font-bold text-foreground">{course.title}</h2>
      {details === "" ? null : (
        <p className="text-base text-muted-foreground">{details}</p>
      )}
      {course.skills.length === 0 ? null : (
        <p className="text-base text-foreground">
          <span className="font-semibold">Habilidades:</span>{" "}
          {course.skills.map((skill) => skill.name).join(", ")}
        </p>
      )}
      {href === null ? (
        <p className="text-base text-muted-foreground">
          O link deste curso não está disponível.
        </p>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Acessar curso ${course.title}, abre em uma nova aba`}
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Acessar curso
          <ArrowRight aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

function CourseSearchLoading() {
  return (
    <div role="status">
      <span className="sr-only">Carregando cursos…</span>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-40 rounded-lg motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function CourseSearchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex max-w-md flex-col gap-4 rounded-lg border border-destructive bg-background p-6"
    >
      <span className="font-mono text-base font-semibold tracking-wide text-destructive uppercase">
        Erro
      </span>
      <p className="text-lg text-foreground">
        Não foi possível carregar os cursos. Tente novamente.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="w-fit"
      >
        Tentar novamente
      </Button>
    </div>
  );
}
