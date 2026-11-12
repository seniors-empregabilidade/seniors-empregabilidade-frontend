import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/lib/api-client";
import {
  clearSession,
  readAccessToken,
  readRefreshToken,
  writeAccessToken,
  writeRefreshToken,
} from "@/lib/session-storage";

import {
  stubApi,
  stubApiRoutes,
  type ApiStub,
  type StubRoute,
} from "../../api-stub";

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

const session = (access: string, refresh: string | null) => ({
  access_token: access,
  id_token: "id",
  refresh_token: refresh,
  expires_in: 900,
  token_type: "Bearer",
  user_id: "11111111-2222-4333-8444-555555555555",
  user_type: "candidate",
});

describe("apiClient session refresh", () => {
  afterEach(() => {
    stub?.restore();
    stub = undefined;
    clearSession();
  });

  function signedIn(): void {
    writeAccessToken("old-access");
    writeRefreshToken("old-refresh");
  }

  function expiringApi(refresh: StubRoute): ApiStub {
    return stubApiRoutes({
      "GET /jobs": (request) =>
        request.authorization === "Bearer new-access"
          ? { status: 200, data: { ok: true } }
          : { status: 401, data: { title: "Unauthorized", status: 401 } },
      "POST /auth/refresh": refresh,
    });
  }

  it("refreshes once on a 401, keeps the old refresh token and retries", async () => {
    signedIn();
    stub = expiringApi({ status: 200, data: session("new-access", null) });

    const response = await apiClient.get("/jobs");

    expect(response.data).toEqual({ ok: true });
    expect(stub.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      "get /jobs",
      "post /auth/refresh",
      "get /jobs",
    ]);
    expect(stub.requests[1]?.body).toEqual({
      refresh_token: "old-refresh",
      access_token: "old-access",
    });
    expect(readAccessToken()).toBe("new-access");
    expect(readRefreshToken()).toBe("old-refresh");
  });

  it("stores a rotated refresh token", async () => {
    signedIn();
    stub = expiringApi({
      status: 200,
      data: session("new-access", "new-refresh"),
    });

    await apiClient.get("/jobs");

    expect(readRefreshToken()).toBe("new-refresh");
  });

  it("shares one refresh between concurrent expired requests", async () => {
    signedIn();
    stub = expiringApi({ status: 200, data: session("new-access", null) });

    await Promise.all([apiClient.get("/jobs"), apiClient.get("/jobs")]);

    expect(stub.requests.filter((r) => r.url === "/auth/refresh")).toHaveLength(
      1,
    );
  });

  it("ends the session when the refresh token is refused", async () => {
    signedIn();
    stub = expiringApi({ status: 401, data: { title: "No", status: 401 } });

    await expect(apiClient.get("/jobs")).rejects.toMatchObject({ status: 401 });

    expect(readAccessToken()).toBeNull();
    expect(readRefreshToken()).toBeNull();
  });

  it("keeps the session when the refresh fails for a server reason", async () => {
    signedIn();
    stub = expiringApi({ status: 503, data: { title: "Down", status: 503 } });

    await expect(apiClient.get("/jobs")).rejects.toMatchObject({ status: 401 });

    expect(readRefreshToken()).toBe("old-refresh");
  });

  it("does not retry a second 401", async () => {
    signedIn();
    stub = stubApiRoutes({
      "GET /jobs": { status: 401, data: { title: "No", status: 401 } },
      "POST /auth/refresh": { status: 200, data: session("new-access", null) },
    });

    await expect(apiClient.get("/jobs")).rejects.toMatchObject({ status: 401 });

    expect(stub.requests.filter((r) => r.url === "/jobs")).toHaveLength(2);
  });

  it("does not treat wrong credentials as an expired session", async () => {
    signedIn();
    stub = stubApiRoutes({
      "POST /auth/login": { status: 401, data: { title: "No", status: 401 } },
    });

    await expect(apiClient.post("/auth/login", {})).rejects.toMatchObject({
      status: 401,
    });

    expect(stub.requests).toHaveLength(1);
  });

  it("does not refresh a visitor who never signed in", async () => {
    stub = expiringApi({ status: 200, data: session("new-access", null) });

    await expect(apiClient.get("/jobs")).rejects.toMatchObject({ status: 401 });

    expect(stub.requests).toHaveLength(1);
  });
});
