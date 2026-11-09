import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  courseSearchQueryOptions,
  fetchCourses,
  type Course,
} from "./trainings-api";

const course: Course = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "NR-11: movimentação de cargas",
  institution: "SENAI",
  mode: "onsite",
  external_link: "https://example.com/nr-11",
  skills: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Operação de empilhadeira",
      type: "hard",
    },
  ],
};

const coursePage = { items: [course], total: 1 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchCourses", () => {
  it("lists published courses and omits a blank skill filter", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: coursePage });

    await expect(fetchCourses("   ")).resolves.toEqual(coursePage);

    expect(get).toHaveBeenCalledWith("/trainings", {
      params: { limit: 20, offset: 0 },
    });
  });

  it("sends the trimmed skill and the abort signal", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: coursePage });
    const controller = new AbortController();

    await fetchCourses("  Excel  ", controller.signal);

    expect(get).toHaveBeenCalledWith("/trainings", {
      params: { limit: 20, offset: 0, skill: "Excel" },
      signal: controller.signal,
    });
  });

  it("rejects a bare array, the shape before the paginated contract", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [course] });

    await expect(fetchCourses("")).rejects.toMatchObject({
      code: "invalid_course_search_response",
    });
  });

  it("rejects a payload that does not match the training contract", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { items: [{ title: "Curso sem contrato" }], total: 1 },
    });

    await expect(fetchCourses("")).rejects.toBeInstanceOf(ApiError);
    await expect(fetchCourses("")).rejects.toMatchObject({
      code: "invalid_course_search_response",
    });
  });
});

describe("courseSearchQueryOptions", () => {
  it("keys the search by the skill and does not retry a failed request", () => {
    const options = courseSearchQueryOptions("Excel");

    expect(options.queryKey).toEqual(["trainings", "search", "Excel"]);
    expect(options.retry).toBe(false);
  });
});
