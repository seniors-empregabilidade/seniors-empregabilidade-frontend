import { afterEach, describe, expect, it } from "vitest";

import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import type { JobPostingValues } from "./job-posting-schema";
import {
  createJob,
  fetchMyJobs,
  searchSkills,
  skillSuggestionsQueryOptions,
} from "./jobs-api";

const job = {
  id: "11111111-1111-4111-8111-111111111111",
  company_id: "22222222-2222-4222-8222-222222222222",
  title: "Desenvolvedor(a) Frontend",
  description: "Vaga para atuar no time de frontend do produto.",
  skills: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "React",
      type: "hard",
    },
  ],
  work_mode: "remote",
  closing_date: "2099-12-31",
  status: "published",
  published_at: "2026-09-23T12:00:00.123456Z",
  created_at: "2026-09-23T12:00:00.123456+00:00",
};

const values: JobPostingValues = {
  title: "Desenvolvedor(a) Frontend",
  description: "Vaga para atuar no time de frontend do produto.",
  workMode: "remote",
  closingDate: "2099-12-31",
  skills: [
    { name: "React", type: "hard" },
    { name: "Comunicação", type: "soft" },
  ],
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

describe("createJob", () => {
  it("sends the job with structured skills in the API contract", async () => {
    stub = stubApiRoutes({ "POST /jobs": { status: 201, data: job } });

    const created = await createJob(values);

    expect(created).toEqual(job);
    expect(stub.requests[0]?.body).toEqual({
      title: values.title,
      description: values.description,
      skills: [
        { name: "React", type: "hard" },
        { name: "Comunicação", type: "soft" },
      ],
      work_mode: "remote",
      closing_date: "2099-12-31",
    });
  });

  it("does not confirm a publication it cannot read", async () => {
    stub = stubApiRoutes({
      "POST /jobs": { status: 201, data: { id: job.id } },
    });

    await expect(createJob(values)).rejects.toMatchObject({
      name: "ApiError",
      code: "invalid_job_response",
    });
  });

  it("keeps the problem code of a refused publication", async () => {
    stub = stubApiRoutes({
      "POST /jobs": {
        status: 422,
        data: {
          title: "Validation Error",
          status: 422,
          code: "closing_date_in_the_past",
          errors: { closing_date: ["The closing date cannot be in the past."] },
        },
      },
    });

    await expect(createJob(values)).rejects.toMatchObject({
      code: "closing_date_in_the_past",
      errors: { closing_date: ["The closing date cannot be in the past."] },
    });
  });
});

describe("fetchMyJobs", () => {
  it("reads the company jobs, including one never published", async () => {
    const draft = { ...job, status: "draft", published_at: null };
    stub = stubApiRoutes({
      "GET /jobs/me": { status: 200, data: [job, draft] },
    });

    await expect(fetchMyJobs()).resolves.toEqual([job, draft]);
  });

  it("rejects a list that breaks the contract", async () => {
    stub = stubApiRoutes({
      "GET /jobs/me": { status: 200, data: [{ ...job, work_mode: "moon" }] },
    });

    await expect(fetchMyJobs()).rejects.toMatchObject({
      code: "invalid_jobs_response",
    });
  });
});

describe("searchSkills", () => {
  it("asks the catalog for a few suggestions of the typed text", async () => {
    stub = stubApiRoutes({ "GET /skills": { status: 200, data: job.skills } });

    await expect(searchSkills("rea")).resolves.toEqual(job.skills);
    expect(stub.requests[0]?.params).toEqual({ search: "rea", limit: 6 });
  });

  it("rejects suggestions that break the contract", async () => {
    stub = stubApiRoutes({
      "GET /skills": { status: 200, data: [{ name: "React" }] },
    });

    await expect(searchSkills("rea")).rejects.toMatchObject({
      code: "invalid_skills_response",
    });
  });

  it("only searches once at least two characters were typed", () => {
    expect(skillSuggestionsQueryOptions("r").enabled).toBe(false);
    expect(skillSuggestionsQueryOptions("re").enabled).toBe(true);
  });
});
