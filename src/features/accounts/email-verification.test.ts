import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import {
  confirmEmail,
  sendVerificationEmail,
  verificationError,
} from "./email-verification";

afterEach(() => vi.restoreAllMocks());

describe("email verification transport", () => {
  it("sends only email and code, supports cancellation and accepts an empty 204", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ status: 204, data: "" });
    const controller = new AbortController();
    const values = {
      email: "pessoa@example.com",
      code: "123456",
      extra: "must not be sent",
    };
    await expect(
      confirmEmail(values, controller.signal),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith(
      "/email-verification/confirm",
      { email: "pessoa@example.com", code: "123456" },
      { signal: controller.signal },
    );
  });

  it("sends only email and accepts an empty 202", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ status: 202, data: "" });
    await expect(
      sendVerificationEmail("pessoa@example.com"),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith(
      "/email-verification/send",
      { email: "pessoa@example.com" },
      {},
    );
  });

  it("preserves the shared error contract", async () => {
    const error = new ApiError({
      message: "Technical detail",
      code: "invalid_verification_code",
      status: 422,
    });
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(error);
    await expect(
      confirmEmail({ email: "pessoa@example.com", code: "123456" }),
    ).rejects.toBe(error);
  });

  it.each([
    "invalid_verification_code",
    "too_many_attempts",
    "identity_provider_unavailable",
    "validation_error",
    "unknown_code",
  ])("translates %s without using server text", (code) => {
    const error = new ApiError({
      message: "PRIVATE TECHNICAL TEXT",
      code,
      errors: { code: ["PRIVATE TECHNICAL TEXT"] },
    });
    const result = verificationError(error);
    expect(result.message).not.toContain("PRIVATE");
    expect(result.fields).toEqual(
      code === "invalid_verification_code" || code === "validation_error"
        ? ["code"]
        : undefined,
    );
  });

  it("handles an unexpected failure without exposing it", () => {
    expect(verificationError(new Error("PRIVATE"))).toEqual({
      message:
        "Não foi possível concluir a verificação. Confira sua conexão e tente novamente.",
    });
  });
});
