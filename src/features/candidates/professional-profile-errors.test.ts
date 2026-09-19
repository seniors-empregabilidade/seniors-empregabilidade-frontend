import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { profileErrorMessage } from "./professional-profile-errors";

describe("profileErrorMessage", () => {
  it("translates a known error code", () => {
    const error = new ApiError({
      message: "The professional profile was not found.",
      code: "profile_not_found",
    });

    expect(profileErrorMessage(error)).toBe(
      "Não encontramos seu perfil de candidato.",
    );
  });

  it("falls back to a generic message for an unknown code", () => {
    const error = new ApiError({
      message: "Some technical detail from the backend.",
      code: "some_unmapped_code",
    });

    expect(profileErrorMessage(error)).toBe(
      "Não foi possível carregar seu perfil. Tente novamente.",
    );
  });

  it("falls back to a generic message for a plain network error", () => {
    expect(profileErrorMessage(new Error("Network Error"))).toBe(
      "Não foi possível carregar seu perfil. Tente novamente.",
    );
  });
});
