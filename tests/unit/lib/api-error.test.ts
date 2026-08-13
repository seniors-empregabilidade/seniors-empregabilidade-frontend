import { describe, expect, it } from "vitest";

import { ApiError, toApiError } from "@/lib/api-error";

describe("toApiError", () => {
  it("preserves an existing ApiError", () => {
    const error = new ApiError({ message: "Known error", status: 409 });

    expect(toApiError(error)).toBe(error);
  });

  it("maps RFC 9457 problem details", () => {
    const error = toApiError({
      isAxiosError: true,
      response: {
        status: 422,
        headers: { "x-request-id": "header-request-id" },
        data: {
          type: "https://example.com/problems/validation",
          title: "Validation failed",
          status: 422,
          detail: "Revise os campos informados.",
          code: "validation_error",
          errors: { email: ["E-mail inválido."] },
          request_id: "body-request-id",
        },
      },
    });

    expect(error).toMatchObject({
      message: "Revise os campos informados.",
      status: 422,
      code: "validation_error",
      requestId: "body-request-id",
      errors: { email: ["E-mail inválido."] },
    });
  });

  it("maps an unstructured HTTP failure to a safe message", () => {
    const error = toApiError({
      isAxiosError: true,
      response: {
        status: 502,
        headers: { "x-request-id": "request-id" },
        data: "Bad gateway",
      },
    });

    expect(error).toMatchObject({
      message: "Não foi possível concluir a comunicação com o servidor.",
      status: 502,
      requestId: "request-id",
    });
  });

  it("maps unknown failures to a safe message", () => {
    expect(toApiError(new Error("sensitive detail")).message).toBe(
      "Ocorreu um erro inesperado.",
    );
  });
});
