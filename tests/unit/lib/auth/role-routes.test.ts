import { describe, expect, it } from "vitest";

import { getRoleHomePath } from "@/lib/auth/role-routes";

describe("getRoleHomePath", () => {
  it("maps each role to its home route", () => {
    expect(getRoleHomePath("candidato")).toBe("/candidato");
    expect(getRoleHomePath("empresa")).toBe("/empresa");
  });
});
