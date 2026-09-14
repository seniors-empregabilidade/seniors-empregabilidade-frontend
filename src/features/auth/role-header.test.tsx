import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleHeader } from "./role-header";

describe("RoleHeader", () => {
  it("shows a greeting and the notifications indicator as static text", () => {
    render(<RoleHeader />);

    expect(screen.getByText("Olá!")).toBeVisible();
    expect(screen.getByText("Notificações")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Notificações" }),
    ).not.toBeInTheDocument();
  });
});
