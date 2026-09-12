import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { stubApi, type ApiStub } from "../../../tests/api-stub";
import { fetchCurrentUser } from "./current-user";

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

describe("fetchCurrentUser", () => {
  it("reads the role the API reports for the current session", async () => {
    stub = stubApi(200, {
      id: "11111111-1111-4111-8111-111111111111",
      user_type: "company",
      company_status: "pending",
    });

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      user_type: "company",
      company_status: "pending",
    });
    expect(stub.requests[0]).toMatchObject({ url: "/auth/me", method: "get" });
  });

  it("treats an account with no company as having no company status", async () => {
    stub = stubApi(200, {
      id: "11111111-1111-4111-8111-111111111111",
      user_type: "candidate",
      company_status: null,
    });

    await expect(fetchCurrentUser()).resolves.toMatchObject({
      company_status: null,
    });
  });

  it("surfaces a refused session as the shared error contract", async () => {
    stub = stubApi(401, {
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      code: "invalid_access_token",
    });

    const error: unknown = await fetchCurrentUser().catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "invalid_access_token" });
  });
});
