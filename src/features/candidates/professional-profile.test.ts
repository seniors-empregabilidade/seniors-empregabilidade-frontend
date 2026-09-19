import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import {
  fetchProfessionalProfile,
  professionalProfileQueryKey,
} from "./professional-profile";

vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn() } }));

const validProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Marcos Silveira",
  age: 58,
  email: "marcos@example.com",
  city: "São Paulo",
  state: "SP",
  photo_url: null,
  summary: "Profissional de operações e logística.",
  experiences: [],
  education: [],
  skills: [],
};

describe("fetchProfessionalProfile", () => {
  it("requests the profile endpoint and returns the parsed data", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce({ data: validProfile });

    await expect(fetchProfessionalProfile()).resolves.toEqual(validProfile);
    expect(get).toHaveBeenCalledWith("/professionals/me");
  });

  it("rejects when the response does not match the expected shape", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: { full_name: "Faltam os outros campos obrigatórios" },
    });

    await expect(fetchProfessionalProfile()).rejects.toThrow();
  });
});

describe("professionalProfileQueryKey", () => {
  it("is a stable, domain-scoped key", () => {
    expect(professionalProfileQueryKey).toEqual([
      "candidates",
      "professional-profile",
    ]);
  });
});
