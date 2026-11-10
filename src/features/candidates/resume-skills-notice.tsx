import { Link } from "@tanstack/react-router";

import type { ProfessionalProfile } from "./professional-profile-schema";

/**
 * Without résumé skills every job shows no requirement met, so the job lists
 * explain why and point to the profile, where the skills are added.
 */
export function ResumeSkillsNotice({
  profile,
}: {
  profile: ProfessionalProfile | undefined;
}) {
  if (!profile || profile.skills.length > 0) {
    return null;
  }

  return (
    <p className="mb-4 rounded-lg border border-border bg-background p-4 text-lg text-foreground">
      Seu currículo ainda não tem habilidades.{" "}
      <Link
        to="/candidato/perfil"
        className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Cadastre suas habilidades em Meu perfil
      </Link>{" "}
      para ver quais requisitos de cada vaga você já atende.
    </p>
  );
}
