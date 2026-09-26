import { describe, expect, it } from "vitest";

import { jobVacancySchema } from "./job-vacancy-schema";

const vacancy = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Supervisor de logística",
  description: "Coordenar a equipe.",
  company_name: "Moveve Distribuição",
  city: "São Paulo",
  state: "SP",
  work_mode: "onsite",
  salary_min: 6500,
  salary_max: 8000,
  published_at: "2026-09-23",
  status: "open",
  has_applied: false,
  skills: ["Excel avançado"],
};

describe("jobVacancySchema", () => {
  it("accepts a complete vacancy", () => {
    expect(jobVacancySchema.parse(vacancy)).toEqual(vacancy);
  });

  it("accepts an empty skill list and missing salary", () => {
    expect(
      jobVacancySchema.parse({
        ...vacancy,
        salary_min: null,
        salary_max: null,
        skills: [],
      }),
    ).toMatchObject({ salary_min: null, skills: [] });
  });

  it("rejects an unknown work mode", () => {
    expect(
      jobVacancySchema.safeParse({ ...vacancy, work_mode: "freelance" })
        .success,
    ).toBe(false);
  });
});
