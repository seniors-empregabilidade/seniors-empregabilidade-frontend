import { describe, expect, it } from "vitest";

import { parseEnv } from "@/config/env";

describe("parseEnv", () => {
  it("accepts an API URL and removes its trailing slash", () => {
    expect(
      parseEnv({ VITE_API_URL: "https://api.example.com/api/v1/" }),
    ).toEqual({ VITE_API_URL: "https://api.example.com/api/v1" });
  });

  it("uses the local API URL when no override is provided", () => {
    expect(parseEnv({})).toEqual({
      VITE_API_URL: "http://localhost:8000/api/v1",
    });
  });

  it("rejects invalid URLs", () => {
    expect(() => parseEnv({ VITE_API_URL: "invalid" })).toThrow(
      "Invalid frontend environment configuration",
    );
  });
});
