import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import {
  addProfileSkill,
  fetchProfessionalProfile,
  professionalProfileQueryKey,
  removeProfileSkill,
  searchSkillCatalog,
} from "./professional-profile";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const validProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Marcos Silveira",
  age: 58,
  email: "marcos@example.com",
  phone: "11988887777",
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
    expect(get).toHaveBeenCalledWith("/professionals/me", {});
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

describe("skill catalog and profile skills", () => {
  it("searches the catalog with the typed text", async () => {
    const skills = [{ id: "s2", name: "Negociação", type: "soft" }];
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: skills,
    });

    await expect(searchSkillCatalog("neg")).resolves.toEqual(skills);
    expect(get).toHaveBeenCalledWith("/skills", {
      params: { search: "neg", limit: 8 },
    });
  });

  it("rejects a catalog response with an unexpected shape", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: ["Negociação"],
    });

    await expect(searchSkillCatalog("neg")).rejects.toThrow();
  });

  it("links a catalog skill to the profile by its id", async () => {
    const skill = { id: "s2", name: "Negociação", type: "soft" };
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: skill });

    await expect(addProfileSkill("s2")).resolves.toEqual(skill);
    expect(post).toHaveBeenCalledWith("/professionals/me/skills", {
      skill_id: "s2",
    });
  });

  it("rejects a linked skill response with an unexpected shape", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({ data: {} });

    await expect(addProfileSkill("s2")).rejects.toThrow();
  });

  it("unlinks a skill from the profile", async () => {
    const remove = vi
      .spyOn(apiClient, "delete")
      .mockResolvedValueOnce({ data: undefined });

    await removeProfileSkill("s2");

    expect(remove).toHaveBeenCalledWith("/professionals/me/skills/s2");
  });
});
