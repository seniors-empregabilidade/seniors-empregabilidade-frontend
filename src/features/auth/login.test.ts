import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { stubApi, type ApiStub } from "../../../tests/api-stub";
import { login } from "./login";

const CREDENTIALS = {
  email: "candidato@exemplo.com",
  password: "senha-sintetica",
};

const SESSION = {
  access_token: "access-token-value",
  id_token: "id-token-value",
  refresh_token: null,
  expires_in: 900,
  token_type: "Bearer",
  user_id: "11111111-1111-4111-8111-111111111111",
  user_type: "company",
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

describe("login", () => {
  it("posts the credentials to the API and returns the session it answered", async () => {
    stub = stubApi(200, SESSION);

    await expect(login(CREDENTIALS)).resolves.toMatchObject({
      user_type: "company",
      access_token: "access-token-value",
      refresh_token: null,
    });

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]).toMatchObject({
      url: "/auth/login",
      method: "post",
      body: CREDENTIALS,
    });
  });

  it("surfaces the stable error code the API answered for wrong credentials", async () => {
    stub = stubApi(401, {
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      detail: "The email or password is incorrect.",
      code: "invalid_credentials",
    });

    const error: unknown = await login(CREDENTIALS).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "invalid_credentials" });
  });

  it("refuses a payload that does not carry a usable session", async () => {
    stub = stubApi(200, { ...SESSION, access_token: "" });

    await expect(login(CREDENTIALS)).rejects.toThrow();
  });
});
