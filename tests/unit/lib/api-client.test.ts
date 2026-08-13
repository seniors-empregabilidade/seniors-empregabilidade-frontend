import { describe, expect, it } from "vitest";

import { apiClient } from "@/lib/api-client";

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
