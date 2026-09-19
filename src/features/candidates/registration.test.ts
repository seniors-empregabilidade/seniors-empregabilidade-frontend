import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { registerProfessional, registrationError } from "./registration";

vi.mock("@/lib/api-client", () => ({ apiClient: { post: vi.fn() } }));

describe("registration contract", () => {
  it("omits empty optional fields and preserves the verification flag", async () => {
    const result = {
      id: "00000000-0000-4000-8000-000000000001",
      full_name: "Pessoa Teste",
      email: "pessoa@example.com",
      email_verification_required: false,
    };
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({ data: result });
    await expect(
      registerProfessional({
        name: "Pessoa Teste",
        cpf: "12345678901",
        birthDate: "1970-01-01",
        phone: "11999990000",
        email: "pessoa@example.com",
        password: "Synthetic123!",
        city: " ",
        state: "",
      }),
    ).resolves.toEqual(result);
    expect(vi.spyOn(apiClient, "post")).toHaveBeenCalledWith("/professionals", {
      full_name: "Pessoa Teste",
      cpf: "12345678901",
      birth_date: "1970-01-01",
      phone: "11999990000",
      email: "pessoa@example.com",
      password: "Synthetic123!",
      terms_version_accepted: "v1",
    });
  });

  it.each([
    new Error("private detail"),
    new ApiError({
      message: "private detail",
      code: "internal_error",
      errors: { "body.unknown": ["private detail"] },
    }),
  ])("keeps unknown errors general and hides technical messages", (error) => {
    expect(registrationError(error)).toEqual({
      message:
        "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
      fields: [],
      offerLogin: false,
    });
  });
});
