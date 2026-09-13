import { isRedirect } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { queryClient } from "@/lib/query-client";
import {
  clearSession,
  readAccessToken,
  writeAccessToken,
} from "@/lib/session-storage";

import { stubApi, type ApiStub } from "../../../tests/api-stub";
import { requireRole } from "./require-role";

const CURRENT_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  user_type: "company",
  company_status: "approved",
};

let stub: ApiStub | undefined;

beforeEach(() => {
  queryClient.clear();
  clearSession();
});

afterEach(() => {
  stub?.restore();
  stub = undefined;
  queryClient.clear();
  clearSession();
});

// A thrown redirect is a Response subclass; the target sits in its options.
function redirectTarget(error: unknown): string | undefined {
  if (!isRedirect(error)) {
    return undefined;
  }

  const { options } = error as unknown as { options?: { href?: string } };

  return options?.href;
}

describe("requireRole", () => {
  it("sends a visitor with no session to the login screen without calling the API", async () => {
    stub = stubApi(200, CURRENT_USER);

    const error: unknown = await requireRole("company").catch(
      (reason: unknown) => reason,
    );

    expect(redirectTarget(error)).toBe("/login");
    expect(stub.requests).toHaveLength(0);
  });

  it("lets the expected role through and answers with the account the API reported", async () => {
    writeAccessToken("access-token-value");
    stub = stubApi(200, CURRENT_USER);

    await expect(requireRole("company")).resolves.toMatchObject({
      user_type: "company",
      company_status: "approved",
    });
  });

  it("sends another role back to its own environment instead of a dead end", async () => {
    writeAccessToken("access-token-value");
    stub = stubApi(200, { ...CURRENT_USER, user_type: "candidate" });

    const error: unknown = await requireRole("administrator").catch(
      (reason: unknown) => reason,
    );

    expect(redirectTarget(error)).toBe("/candidato");
  });

  it("drops a refused session so the next route does not repeat the failure", async () => {
    writeAccessToken("expired-token-value");
    stub = stubApi(401, {
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      code: "invalid_access_token",
    });

    const error: unknown = await requireRole("candidate").catch(
      (reason: unknown) => reason,
    );

    expect(redirectTarget(error)).toBe("/login");
    expect(readAccessToken()).toBeNull();
  });
});
