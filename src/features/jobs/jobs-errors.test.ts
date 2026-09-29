import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import {
  isAwaitingApproval,
  jobPostingFailure,
  myJobsErrorMessage,
} from "./jobs-errors";

describe("jobPostingFailure", () => {
  it("places FastAPI field errors on the form fields they belong to", () => {
    const failure = jobPostingFailure(
      new ApiError({
        message: "The request contains invalid data.",
        status: 422,
        code: "validation_error",
        errors: {
          "body.title": ["String should have at least 1 character"],
          "body.skills.0.name": ["Value error"],
          "body.skills.1.name": ["Value error"],
          "body.work_mode": ["Input should be 'onsite', 'hybrid' or 'remote'"],
          "body.unexpected": ["Extra inputs are not permitted"],
        },
      }),
    );

    expect(failure.message).toBe(
      "Confira os campos destacados e tente novamente.",
    );
    expect(failure.fields.map(({ field }) => field)).toEqual([
      "title",
      "skills",
      "workMode",
    ]);
    expect(failure.fields[1]?.message).toMatch(/habilidades/);
  });

  it("places a past closing date on the closing date field", () => {
    const failure = jobPostingFailure(
      new ApiError({
        message: "The closing date cannot be in the past.",
        status: 422,
        code: "closing_date_in_the_past",
        errors: { closing_date: ["The closing date cannot be in the past."] },
      }),
    );

    expect(failure).toEqual({
      message: "Confira a data de encerramento.",
      fields: [
        {
          field: "closingDate",
          message: "A data de encerramento não pode estar no passado.",
        },
      ],
    });
  });

  it("explains that only an approved company publishes", () => {
    expect(
      jobPostingFailure(
        new ApiError({
          message: "An approved company account is required.",
          status: 403,
          code: "approved_company_required",
        }),
      ).message,
    ).toMatch(/ainda não foi aprovada/);
  });

  it.each([
    [
      "an unmapped code",
      new ApiError({ message: "x", code: "internal_error" }),
    ],
    ["a network failure", new ApiError({ message: "x" })],
    ["an unknown error", new Error("boom")],
  ])("keeps %s generic, never showing the server text", (_, error) => {
    expect(jobPostingFailure(error)).toEqual({
      message:
        "Não foi possível publicar a vaga. Seus dados foram mantidos; tente novamente.",
      fields: [],
    });
  });
});

describe("myJobsErrorMessage", () => {
  it("tells a company awaiting approval why the list is unavailable", () => {
    const error = new ApiError({
      message: "An approved company account is required.",
      code: "approved_company_required",
    });

    expect(isAwaitingApproval(error)).toBe(true);
    expect(myJobsErrorMessage(error)).toMatch(/ainda não foi aprovada/);
  });

  it("stays generic for any other failure", () => {
    expect(isAwaitingApproval(new Error("boom"))).toBe(false);
    expect(myJobsErrorMessage(new Error("boom"))).toBe(
      "Não foi possível carregar suas vagas. Tente novamente.",
    );
  });
});
