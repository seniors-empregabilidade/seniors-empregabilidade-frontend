import { describe, expect, it } from "vitest";

import {
  jobPostingSchema,
  normalizeSkillName,
  todayIsoDate,
} from "./job-posting-schema";

const valid = {
  title: "Analista de operações",
  description: "Vaga sintética para testes.",
  workMode: "hybrid",
  closingDate: "2099-12-31",
  skills: [{ name: "Gestão de equipes", type: "soft" }],
};

function messagesFor(input: unknown): Record<string, string[]> {
  const result = jobPostingSchema.safeParse(input);
  if (result.success) return {};
  const messages: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    (messages[key] ??= []).push(issue.message);
  }
  return messages;
}

describe("jobPostingSchema", () => {
  it("accepts a complete job", () => {
    expect(jobPostingSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a title, a work mode, a closing date and at least one skill", () => {
    expect(
      messagesFor({
        ...valid,
        title: "   ",
        workMode: null,
        closingDate: "",
        skills: [],
      }),
    ).toEqual({
      title: ["Preencha este campo."],
      workMode: ["Escolha a modalidade de trabalho."],
      closingDate: ["Informe a data de encerramento."],
      skills: ["Adicione pelo menos uma habilidade."],
    });
  });

  it("rejects a closing date before today and accepts today", () => {
    expect(messagesFor({ ...valid, closingDate: "2000-01-01" })).toEqual({
      closingDate: ["A data de encerramento não pode estar no passado."],
    });
    expect(
      jobPostingSchema.safeParse({ ...valid, closingDate: todayIsoDate() })
        .success,
    ).toBe(true);
  });

  it("rejects a skill without a known type", () => {
    expect(
      jobPostingSchema.safeParse({
        ...valid,
        skills: [{ name: "React", type: "other" }],
      }).success,
    ).toBe(false);
  });
});

describe("normalizeSkillName", () => {
  it("compares names without case, accents or repeated spaces", () => {
    expect(normalizeSkillName("  GESTÃO   de\tEquipes ")).toBe(
      "gestao de equipes",
    );
  });

  it("leaves nothing of a name made only of accents", () => {
    expect(normalizeSkillName("́")).toBe("");
  });
});

describe("todayIsoDate", () => {
  it("formats the local calendar date with padded month and day", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
