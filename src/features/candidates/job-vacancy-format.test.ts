import { describe, expect, it } from "vitest";

import {
  companyInitials,
  formatLocation,
  formatPublishedLabel,
  formatSalaryRange,
  formatVacancyMeta,
  formatWorkMode,
} from "./job-vacancy-format";
import type { JobVacancy } from "./job-vacancy-schema";

const vacancy: JobVacancy = {
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
  skills: [],
};

describe("companyInitials", () => {
  it("uses the first letter of the first two words", () => {
    expect(companyInitials("Moveve Distribuição")).toBe("MD");
  });

  it("uses the first two letters of a single word", () => {
    expect(companyInitials("Acme")).toBe("AC");
  });
});

describe("formatWorkMode", () => {
  it("maps each work mode to Portuguese copy", () => {
    expect(formatWorkMode("onsite")).toBe("Presencial");
    expect(formatWorkMode("remote")).toBe("Remoto");
    expect(formatWorkMode("hybrid")).toBe("Híbrido");
  });
});

describe("formatLocation", () => {
  it("joins city and state when both exist", () => {
    expect(formatLocation("São Paulo", "SP")).toBe("São Paulo, SP");
  });

  it("returns the remaining part when only one exists", () => {
    expect(formatLocation("Campinas", null)).toBe("Campinas");
    expect(formatLocation(null, "RJ")).toBe("RJ");
  });

  it("returns null when both parts are missing", () => {
    expect(formatLocation(null, null)).toBeNull();
  });
});

describe("formatSalaryRange", () => {
  it("formats a closed range in Brazilian reais", () => {
    expect(formatSalaryRange(6500, 8000)).toBe("R$\u00a06.500 a R$\u00a08.000");
  });

  it("formats an open minimum and an open maximum", () => {
    expect(formatSalaryRange(6500, null)).toBe("a partir de R$\u00a06.500");
    expect(formatSalaryRange(null, 8000)).toBe("até R$\u00a08.000");
  });

  it("returns null when the vacancy has no salary", () => {
    expect(formatSalaryRange(null, null)).toBeNull();
  });
});

describe("formatPublishedLabel", () => {
  const now = new Date(2026, 8, 26);

  it("uses calendar days from the leading date, ignoring a time suffix", () => {
    expect(formatPublishedLabel("2026-09-23T23:00:00Z", now)).toBe(
      "publicada há 3 dias",
    );
  });

  it("uses singular copy for yesterday and today for the same calendar day", () => {
    expect(formatPublishedLabel("2026-09-25", now)).toBe("publicada há 1 dia");
    expect(formatPublishedLabel("2026-09-26", now)).toBe("publicada hoje");
  });

  it("returns null when the timestamp has no date prefix", () => {
    expect(formatPublishedLabel("ontem")).toBeNull();
  });
});

describe("formatVacancyMeta", () => {
  it("joins location, work mode, salary and published date", () => {
    expect(formatVacancyMeta(vacancy, new Date(2026, 8, 26))).toBe(
      "São Paulo, SP · Presencial · R$\u00a06.500 a R$\u00a08.000 · publicada há 3 dias",
    );
  });

  it("omits missing optional parts from the metadata line", () => {
    expect(
      formatVacancyMeta(
        {
          ...vacancy,
          city: null,
          state: null,
          salary_min: null,
          salary_max: null,
          published_at: "sem-data",
        },
        new Date(2026, 8, 26),
      ),
    ).toBe("Presencial");
  });
});
