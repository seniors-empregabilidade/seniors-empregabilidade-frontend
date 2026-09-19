import { describe, expect, it } from "vitest";

import {
  calculateAge,
  formatExperiencePeriod,
  getYear,
} from "./profile-date-utils";

describe("getYear", () => {
  it("reads the year directly from the ISO string, avoiding timezone shifts", () => {
    expect(getYear("2011-01-01")).toBe(2011);
  });
});

describe("formatExperiencePeriod", () => {
  it("does not shift the year backwards due to timezone (Jan 1st bug)", () => {
    // new Date("2012-01-01") vira 31/12/2011 no fuso do Brasil (UTC-3).
    // Isso NÃO pode acontecer aqui.
    const { label } = formatExperiencePeriod("2012-01-01", "2023-01-01");
    expect(label).toBe("2012 – 2023");
  });

  it("floors the duration instead of rounding it up", () => {
    // 6 anos e 9 meses deve mostrar "6 anos", nunca "7 anos".
    const { duration } = formatExperiencePeriod("2012-01-01", "2018-10-01");
    expect(duration).toBe("6 anos");
  });

  it("uses singular for exactly 1 year", () => {
    const { duration } = formatExperiencePeriod("2020-01-01", "2021-01-01");
    expect(duration).toBe("1 ano");
  });

  it("shows 'atual' for an ongoing experience (null end_date)", () => {
    const { label } = formatExperiencePeriod("2020-01-01", null);
    expect(label).toMatch(/2020 – atual/);
  });

  it("shows 'menos de 1 ano' for a short experience", () => {
    const { duration } = formatExperiencePeriod("2024-01-01", "2024-06-01");
    expect(duration).toBe("menos de 1 ano");
  });
});

describe("calculateAge", () => {
  it("calculates age correctly regardless of timezone", () => {
    // Se a pessoa nasceu em 2000-01-01, hoje ela tem pelo menos 25 anos,
    // independente de qual fuso horário rodou o teste.
    const age = calculateAge("2000-01-01");
    expect(age).toBeGreaterThanOrEqual(25);
  });
});
