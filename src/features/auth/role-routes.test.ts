import { describe, expect, it } from "vitest";

import { getRoleHomePath } from "./role-routes";

describe("getRoleHomePath", () => {
  it("maps each user type to its home route", () => {
    expect(getRoleHomePath("candidate")).toBe("/candidato");
    expect(getRoleHomePath("company")).toBe("/empresa");
    expect(getRoleHomePath("administrator")).toBe("/administrador");
  });
});
