import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleHomePage } from "./role-home-page";

describe("RoleHomePage", () => {
  it("renders the provided title", () => {
    render(<RoleHomePage title="Área do candidato" />);

    expect(
      screen.getByRole("heading", { name: "Área do candidato" }),
    ).toBeVisible();
  });
});
