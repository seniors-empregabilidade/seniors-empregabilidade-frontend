import { afterEach, describe, expect, it } from "vitest";

import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import type { JobPostingValues } from "./job-posting-schema";
import {
  changeJobStatus,
  createJob,
  fetchMyJobs,
  searchSkills,
  skillSuggestionsQueryOptions,
  updateJob,
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

describe("updateJob", () => {
  const path = `PATCH /jobs/${job.id}`;
  const edit = {
    id: job.id,
    title: "Desenvolvedor(a) Frontend Sênior",
    description: "Nova descrição da vaga.",
    skills: values.skills,
  };

  it("sends only the editable fields, with structured skills", async () => {
    stub = stubApiRoutes({
      [path]: { status: 200, data: { ...job, title: edit.title } },
    });

    await expect(updateJob(edit)).resolves.toMatchObject({ title: edit.title });
    expect(stub.requests[0]?.body).toEqual({
      title: edit.title,
      description: edit.description,
      skills: [
        { name: "React", type: "hard" },
        { name: "Comunicação", type: "soft" },
      ],
    });
  });

  it("does not confirm a change it cannot read", async () => {
    stub = stubApiRoutes({ [path]: { status: 200, data: { id: job.id } } });

    await expect(updateJob(edit)).rejects.toMatchObject({
      code: "invalid_job_update_response",
    });
  });

  it("keeps the problem code of a refused change", async () => {
    stub = stubApiRoutes({
      [path]: {
        status: 404,
        data: { title: "Not Found", status: 404, code: "job_not_found" },
      },
    });

    await expect(updateJob(edit)).rejects.toMatchObject({
      code: "job_not_found",
    });
  });
});

describe("fetchMyJobs", () => {
  const listed = { ...job, application_count: 3 };

  it("reads the company jobs with their application counts, closed and never published ones included", async () => {
    const closed = { ...listed, status: "closed", application_count: 0 };
    const draft = { ...listed, status: "draft", published_at: null };
    stub = stubApiRoutes({
      "GET /jobs/me": { status: 200, data: [listed, closed, draft] },
    });

    await expect(fetchMyJobs()).resolves.toEqual([listed, closed, draft]);
  });

  it.each([
    ["an unknown work mode", { ...listed, work_mode: "moon" }],
    ["a missing application count", job],
  ])("rejects a list with %s", async (_, item) => {
    stub = stubApiRoutes({ "GET /jobs/me": { status: 200, data: [item] } });

    await expect(fetchMyJobs()).rejects.toMatchObject({
      code: "invalid_jobs_response",
    });
  });
});

describe("changeJobStatus", () => {
  const path = `PATCH /jobs/${job.id}/status`;

  it("closes a job with the API vocabulary", async () => {
    stub = stubApiRoutes({
      [path]: { status: 200, data: { ...job, status: "closed" } },
    });

    await expect(
      changeJobStatus({ id: job.id, status: "closed" }),
    ).resolves.toMatchObject({ status: "closed" });
    expect(stub.requests[0]?.body).toEqual({ status: "closed" });
  });

  it("reopens a job, sending a new closing date only when there is one", async () => {
    stub = stubApiRoutes({ [path]: { status: 200, data: job } });

    await changeJobStatus({ id: job.id, status: "open" });
    await changeJobStatus({
      id: job.id,
      status: "open",
      closingDate: "2099-12-31",
    });

    expect(stub.requests.map((request) => request.body)).toEqual([
      { status: "open" },
      { status: "open", closing_date: "2099-12-31" },
    ]);
  });

  it("does not confirm a change it cannot read", async () => {
    stub = stubApiRoutes({ [path]: { status: 200, data: { id: job.id } } });

    await expect(
      changeJobStatus({ id: job.id, status: "closed" }),
    ).rejects.toMatchObject({ code: "invalid_job_status_response" });
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
