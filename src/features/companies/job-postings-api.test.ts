import { beforeEach, expect, it, vi } from "vitest";

import { createJobPosting } from "./job-postings-api";
import type { JobPostingValues } from "./job-posting-schema";

const requests = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiClient: requests }));
beforeEach(() => {
  vi.resetAllMocks();
});

const values: JobPostingValues = {
  title: "Desenvolvedor(a) Frontend",
  description: "Vaga para atuar no time de frontend do produto.",
  skills: ["React", "TypeScript"],
};

it("sends the job posting payload and returns the parsed response", async () => {
  const created = { id: "11111111-1111-4111-8111-111111111111" };
  requests.post.mockResolvedValue({ data: created });

  const result = await createJobPosting(values);

  expect(result).toEqual(created);
  expect(requests.post).toHaveBeenCalledWith("/job-postings", {
    title: values.title,
    description: values.description,
    skills: values.skills,
  });
});

it("maps a malformed response to the API error contract", async () => {
  requests.post.mockResolvedValue({ data: { id: "not-a-uuid" } });
  await expect(createJobPosting(values)).rejects.toMatchObject({
    name: "ApiError",
    code: "invalid_job_posting_response",
  });
});

it("maps a missing response to the API error contract", async () => {
  requests.post.mockResolvedValue({ data: null });
  await expect(createJobPosting(values)).rejects.toMatchObject({
    name: "ApiError",
    code: "invalid_job_posting_response",
  });
});
