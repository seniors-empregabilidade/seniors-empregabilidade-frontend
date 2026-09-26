import { describe, expect, it } from "vitest";

import { matchJobVacancySkills } from "./job-vacancy-match";

describe("matchJobVacancySkills", () => {
  it("counts matched and missing skills without regard to case or extra spaces", () => {
    expect(
      matchJobVacancySkills(
        ["Gestão de equipe", "Excel avançado", "NR-11"],
        ["  gestão de equipe", "EXCEL AVANÇADO"],
      ),
    ).toEqual({
      matched: ["Gestão de equipe", "Excel avançado"],
      missing: ["NR-11"],
      total: 3,
    });
  });

  it("treats every requirement as missing when the profile has no skills", () => {
    expect(matchJobVacancySkills(["WMS", "Inglês"], [])).toEqual({
      matched: [],
      missing: ["WMS", "Inglês"],
      total: 2,
    });
  });
});
