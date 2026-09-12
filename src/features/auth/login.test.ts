import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { login } from "./login";

describe("login", () => {
  it("returns a candidate session for a successful mock login", async () => {
    await expect(
      login({
        email: "usuario@exemplo.com",
        password: "senha-segura",
      }),
    ).resolves.toMatchObject({ user_type: "candidate" });
  });

  it("returns a company session when the mock email starts with empresa@", async () => {
    await expect(
      login({
        email: "empresa@exemplo.com",
        password: "senha-segura",
      }),
    ).resolves.toMatchObject({ user_type: "company" });
  });

  it("returns an administrator session when the mock email starts with admin@", async () => {
    await expect(
      login({
        email: "admin@exemplo.com",
        password: "senha-segura",
      }),
    ).resolves.toMatchObject({ user_type: "administrator" });
  });

  it("throws a generic authentication error for the mock incorrect password", async () => {
    await expect(
      login({
        email: "usuario@exemplo.com",
        password: "incorreta",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "invalid_credentials",
    });
  });

  it("throws field errors from the mock validation payload", async () => {
    const error = await login({
      email: "invalido@exemplo.com",
      password: "senha-segura",
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      errors: { email: ["E-mail inválido"] },
    });
  });
});
