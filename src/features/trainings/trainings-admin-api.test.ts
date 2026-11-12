import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import {
  changeTrainingPublication,
  createTraining,
  defaultTrainingFilters,
  fetchAdminTrainings,
  fetchJobOptions,
  fetchSkillOptions,
  jobOptionsErrorMessage,
  missingRelation,
  skillOptionsErrorMessage,
  trainingPublicationErrorMessage,
  trainingSaveErrorMessage,
  trainingsErrorMessage,
  trainingsSearchParams,
  trainingValuesSchema,
  updateTraining,
} from "./trainings-admin-api";

const skill = {
  id: "64000000-0000-4000-8000-000000000001",
  name: "Excel",
  type: "hard",
};
const training = {
  id: "66000000-0000-4000-8000-000000000001",
  title: "Excel básico",
  institution: "Instituto Sintético",
  mode: "online",
  external_link: "https://example.invalid/excel",
  published: true,
  skills: [skill],
  job_ids: ["67000000-0000-4000-8000-000000000001"],
  jobs: [{ id: "67000000-0000-4000-8000-000000000001", title: "Analista" }],
};
const jobOption = {
  id: "67000000-0000-4000-8000-000000000001",
  title: "Analista",
  company_name: "Empresa Sintética",
  status: "published",
};
const values = {
  title: "  Excel básico ",
  institution: "Instituto Sintético",
  mode: "online" as const,
  external_link: " https://example.invalid/excel ",
  published: false,
  skills: [{ ...skill, type: "hard" as const }],
  jobs: [{ id: "67000000-0000-4000-8000-000000000001", title: "Analista" }],
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function apiError(status: number, code?: string) {
  return new ApiError({ message: "no", status, code });
}

describe("training filters", () => {
  it("sends only the filters in use", () => {
    expect(trainingsSearchParams(defaultTrainingFilters)).toBe(
      "limit=20&offset=0",
    );
    expect(
      trainingsSearchParams({
        search: "  excel ",
        published: "unpublished",
        offset: 20,
      }),
    ).toBe("search=excel&published=false&limit=20&offset=20");
    expect(
      trainingsSearchParams({ search: "", published: "published", offset: 0 }),
    ).toBe("published=true&limit=20&offset=0");
  });
});

describe("trainingValuesSchema", () => {
  it("trims the text and accepts a complete course", () => {
    const parsed = trainingValuesSchema.safeParse(values);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.title).toBe("Excel básico");
    expect(parsed.data?.external_link).toBe("https://example.invalid/excel");
  });

  it("requires title, institution, mode and a web link", () => {
    expect(
      trainingValuesSchema.safeParse({ ...values, title: "  " }).success,
    ).toBe(false);
    expect(
      trainingValuesSchema.safeParse({ ...values, institution: "" }).success,
    ).toBe(false);
    expect(
      trainingValuesSchema.safeParse({ ...values, mode: undefined }).success,
    ).toBe(false);
    for (const link of [
      "",
      "example.invalid",
      "ftp://example.invalid",
      "javascript:alert(1)",
      "https://exa mple.invalid",
    ]) {
      expect(
        trainingValuesSchema.safeParse({ ...values, external_link: link })
          .success,
      ).toBe(false);
    }
  });

  it("enforces the length and relation limits of the backend", () => {
    expect(
      trainingValuesSchema.safeParse({ ...values, title: "x".repeat(151) })
        .success,
    ).toBe(false);
    const many = Array.from({ length: 51 }, (_, index) => ({
      ...skill,
      type: "hard" as const,
      id: `68000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    }));
    expect(
      trainingValuesSchema.safeParse({ ...values, skills: many }).success,
    ).toBe(false);
    const manyJobs = many.map(({ id }) => ({ id, title: "Vaga" }));
    expect(
      trainingValuesSchema.safeParse({ ...values, jobs: manyJobs }).success,
    ).toBe(false);
  });
});

describe("training requests", () => {
  it("reads one page of courses", async () => {
    stub = stubApiRoutes({
      "GET /admin/trainings?limit=20&offset=0": {
        status: 200,
        data: { items: [training], total: 1 },
      },
    });

    await expect(fetchAdminTrainings(defaultTrainingFilters)).resolves.toEqual({
      items: [training],
      total: 1,
    });
  });

  it("refuses a malformed list", async () => {
    stub = stubApiRoutes({
      "GET /admin/trainings?limit=20&offset=0": {
        status: 200,
        data: { items: [{ id: "x" }], total: 1 },
      },
    });

    await expect(
      fetchAdminTrainings(defaultTrainingFilters),
    ).rejects.toMatchObject({ code: "invalid_training_list_response" });
  });

  it("refuses a course without its named jobs, so saving cannot erase them", async () => {
    const withoutJobs = Object.fromEntries(
      Object.entries(training).filter(([key]) => key !== "jobs"),
    );
    stub = stubApiRoutes({
      "GET /admin/trainings?limit=20&offset=0": {
        status: 200,
        data: { items: [withoutJobs], total: 1 },
      },
    });

    await expect(
      fetchAdminTrainings(defaultTrainingFilters),
    ).rejects.toMatchObject({ code: "invalid_training_list_response" });
  });

  it("creates a course sending the skill and job ids", async () => {
    stub = stubApiRoutes({
      "POST /admin/trainings": { status: 201, data: training },
    });

    await expect(
      createTraining(trainingValuesSchema.parse(values)),
    ).resolves.toEqual(training);
    expect(stub.requests[0]?.body).toEqual({
      title: "Excel básico",
      institution: "Instituto Sintético",
      mode: "online",
      external_link: "https://example.invalid/excel",
      published: false,
      skill_ids: [skill.id],
      job_ids: [jobOption.id],
    });
  });

  it("updates a course through PATCH sending its jobs as the complete set", async () => {
    stub = stubApiRoutes({
      [`PATCH /admin/trainings/${training.id}`]: {
        status: 200,
        data: training,
      },
    });

    await updateTraining(training.id, trainingValuesSchema.parse(values));

    expect(stub.requests[0]?.body).toHaveProperty("job_ids", [jobOption.id]);
    expect(stub.requests[0]?.body).toHaveProperty("skill_ids", [skill.id]);
  });

  it("publishes and unpublishes with a body of its own", async () => {
    stub = stubApiRoutes({
      [`PATCH /admin/trainings/${training.id}`]: {
        status: 200,
        data: { ...training, published: false },
      },
    });

    await changeTrainingPublication(training.id, false);

    expect(stub.requests[0]?.body).toEqual({ published: false });
  });

  it("refuses a malformed course in a write answer", async () => {
    stub = stubApiRoutes({
      "POST /admin/trainings": { status: 201, data: { id: "x" } },
    });

    await expect(createTraining(values)).rejects.toMatchObject({
      code: "invalid_training_response",
    });
  });

  it("searches the active skills of the catalog", async () => {
    stub = stubApiRoutes({ "GET /skills": { status: 200, data: [skill] } });

    await expect(fetchSkillOptions("  exc ")).resolves.toEqual([skill]);
    expect(stub.requests[0]?.params).toEqual({ limit: 20, search: "exc" });

    await fetchSkillOptions("");
    expect(stub.requests[1]?.params).toEqual({ limit: 20 });
  });

  it("searches the jobs an administrator can relate", async () => {
    stub = stubApiRoutes({
      "GET /admin/jobs": {
        status: 200,
        data: { items: [jobOption], total: 1 },
      },
    });

    await expect(fetchJobOptions("  ana ")).resolves.toEqual({
      items: [jobOption],
      total: 1,
    });
    expect(stub.requests[0]?.params).toEqual({ limit: 20, search: "ana" });

    await fetchJobOptions("");
    expect(stub.requests[1]?.params).toEqual({ limit: 20 });
  });

  it("refuses a malformed job list", async () => {
    stub = stubApiRoutes({ "GET /admin/jobs": { status: 200, data: [] } });

    await expect(fetchJobOptions("")).rejects.toMatchObject({
      code: "invalid_job_options_response",
    });
  });

  it("refuses a malformed skill list", async () => {
    stub = stubApiRoutes({ "GET /skills": { status: 200, data: {} } });

    await expect(fetchSkillOptions("")).rejects.toMatchObject({
      code: "invalid_skill_options_response",
    });
  });
});

describe("error messages", () => {
  it("explains a refused list", () => {
    expect(trainingsErrorMessage(apiError(403, "administrator_required"))).toBe(
      "Apenas administradores podem consultar os cursos.",
    );
    expect(trainingsErrorMessage(apiError(500))).toBe(
      "Não foi possível carregar os cursos. Tente novamente.",
    );
  });

  it("explains each way a save can fail", () => {
    expect(
      trainingSaveErrorMessage(apiError(404, "training_not_found")),
    ).toMatch(/não está mais disponível/);
    expect(
      trainingSaveErrorMessage(apiError(422, "training_relation_not_found")),
    ).toMatch(/competência escolhida não existe mais/);
    const missingJob = new ApiError({
      message: "no",
      status: 422,
      code: "training_relation_not_found",
      errors: { job_ids: ["Some job does not exist."] },
    });
    expect(trainingSaveErrorMessage(missingJob)).toMatch(
      /vaga escolhida não existe mais/,
    );
    expect(missingRelation(missingJob)).toBe("job_ids");
    expect(missingRelation(apiError(422, "training_relation_not_found"))).toBe(
      "skill_ids",
    );
    expect(missingRelation(apiError(500))).toBeNull();
    expect(trainingSaveErrorMessage(apiError(422, "validation_error"))).toMatch(
      /Revise os campos/,
    );
    expect(trainingSaveErrorMessage(apiError(403))).toMatch(
      /Apenas administradores/,
    );
    expect(trainingSaveErrorMessage(apiError(500))).toMatch(
      /Os dados foram mantidos/,
    );
  });

  it("explains a failed inactivation and reactivation", () => {
    expect(trainingPublicationErrorMessage(apiError(500), false)).toBe(
      "Não foi possível inativar o curso. Tente novamente.",
    );
    expect(trainingPublicationErrorMessage(apiError(500), true)).toBe(
      "Não foi possível reativar o curso. Tente novamente.",
    );
    expect(
      trainingPublicationErrorMessage(
        apiError(404, "training_not_found"),
        true,
      ),
    ).toMatch(/não está mais disponível/);
    expect(
      trainingPublicationErrorMessage(
        apiError(403, "administrator_required"),
        true,
      ),
    ).toMatch(/Apenas administradores/);
    expect(skillOptionsErrorMessage()).toMatch(/competências/);
    expect(jobOptionsErrorMessage()).toMatch(/vagas/);
  });
});
