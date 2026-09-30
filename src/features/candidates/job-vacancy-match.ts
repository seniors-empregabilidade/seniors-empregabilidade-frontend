export interface JobVacancyMatch {
  matched: string[];
  missing: string[];
  total: number;
}

function normalizeSkill(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function matchJobVacancySkills(
  requiredSkills: string[],
  candidateSkillNames: string[],
): JobVacancyMatch {
  const owned = new Set(
    candidateSkillNames.map(normalizeSkill).filter((name) => name.length > 0),
  );

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    if (owned.has(normalizeSkill(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return {
    matched,
    missing,
    total: requiredSkills.length,
  };
}
