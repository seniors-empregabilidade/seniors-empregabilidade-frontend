import { describe, expect, it } from "vitest";

import { professionalProfileSchema } from "./professional-profile-schema";

const validProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Marcos Silveira",
  age: 58,
  email: "marcos@example.com",
  city: "São Paulo",
  state: "SP",
  photo_url: null,
  summary: "Profissional de operações e logística.",
  experiences: [
    {
      id: "1",
      role: "Gerente de Operações",
      company: "Log Brasil",
      start_date: "2012-01-01",
      end_date: "2023-01-01",
      description: "Equipe de 40 pessoas em 3 centros de distribuição.",
    },
  ],
  education: [
    {
      id: "1",
      course: "MBA em Gestão Empresarial",
      institution: "FGV",
      year: 2011,
    },
  ],
  skills: ["Liderança", "Logística"],
};

describe("professionalProfileSchema", () => {
  it("parses a complete valid profile", () => {
    expect(professionalProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it("accepts an omitted photo_url", () => {
    const withoutPhoto: Partial<typeof validProfile> = { ...validProfile };
    delete withoutPhoto.photo_url;

    expect(professionalProfileSchema.parse(withoutPhoto)).toMatchObject(
      withoutPhoto,
    );
  });

  it("accepts empty experiences, education and skills", () => {
    const empty = {
      ...validProfile,
      experiences: [],
      education: [],
      skills: [],
    };
    expect(professionalProfileSchema.parse(empty)).toEqual(empty);
  });

  it("accepts a null end_date for an ongoing experience", () => {
    const ongoing = {
      ...validProfile,
      experiences: [{ ...validProfile.experiences[0]!, end_date: null }],
    };
    expect(professionalProfileSchema.parse(ongoing)).toEqual(ongoing);
  });

  it.each([
    ["id", undefined],
    ["full_name", undefined],
    ["age", "58"],
    ["email", undefined],
    ["city", undefined],
    ["state", undefined],
    ["summary", undefined],
    ["experiences", undefined],
    ["education", undefined],
    ["skills", undefined],
  ])("rejects a missing or invalid %s", (field, value) => {
    const invalid = { ...validProfile, [field]: value };
    expect(professionalProfileSchema.safeParse(invalid).success).toBe(false);
  });
});
