import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/lib/api-client";
import { clearSession, writeAccessToken } from "@/lib/session-storage";

import { stubApi, type ApiStub } from "../../api-stub";

let stub: ApiStub | undefined;

describe("apiClient", () => {
  it("uses the validated base URL and timeout", () => {
    expect(apiClient.defaults.baseURL).toBe("http://localhost:8000/api/v1");
    expect(apiClient.defaults.timeout).toBe(15_000);
    expect(apiClient.defaults.headers.Accept).toBe("application/json");
  });

  it("maps rejected responses through the shared error contract", async () => {
    const request = apiClient.get("/unavailable", {
      adapter: () =>
        Promise.reject(
          Object.assign(new Error("Service unavailable"), {
            isAxiosError: true,
            response: {
              status: 503,
              headers: {},
              data: {
                type: "about:blank",
                title: "Service unavailable",
                status: 503,
                code: "service_unavailable",
              },
            },
          }),
        ),
    });

    await expect(request).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      code: "service_unavailable",
    });
  });
});

describe("apiClient authorization", () => {
  afterEach(() => {
    stub?.restore();
    stub = undefined;
    clearSession();
  });

  it("sends no Authorization header while nobody is signed in", async () => {
    stub = stubApi(200, {});

    await apiClient.get("/auth/me");

    expect(stub.requests[0]?.authorization).toBeNull();
  });

  it("carries the stored access token as a bearer credential", async () => {
    writeAccessToken("access-token-value");
    stub = stubApi(200, {});

    await apiClient.get("/auth/me");

    expect(stub.requests[0]?.authorization).toBe("Bearer access-token-value");
  });

  it.each([
    ["https://viacep.com.br/ws/90430000/json/", "the postal code provider"],
    [
      "https://brasilapi.com.br/api/cnpj/v1/11222333000181",
      "another third party",
    ],
    ["//evil.invalid/collect", "a protocol relative address"],
  ])("never sends the credential to %s (%s)", async (url) => {
    writeAccessToken("access-token-value");
    stub = stubApi(200, {});

    await apiClient.get(url);

    expect(stub.requests[0]?.authorization).toBeNull();
  });

  it("still authorises a request that reaches the API by absolute URL", async () => {
    writeAccessToken("access-token-value");
    stub = stubApi(200, {});

    await apiClient.get("http://localhost:8000/api/v1/auth/me");

    expect(stub.requests[0]?.authorization).toBe("Bearer access-token-value");
  });
});
