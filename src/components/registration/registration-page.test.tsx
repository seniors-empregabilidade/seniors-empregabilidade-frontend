import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { RegistrationPage } from "./registration-page";

it("switches between the existing candidate form and the company form", async () => {
  render(
    <RegistrationPage
      candidate={<p>Candidate form</p>}
      company={<p>Company form</p>}
    />,
  );
  expect(screen.getByText("Candidate form")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Empresa" }));
  expect(screen.getByRole("main")).toHaveTextContent("Company form");
  expect(screen.getByRole("button", { name: "Empresa" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await userEvent.click(screen.getByRole("button", { name: "Candidato" }));
  expect(screen.getByText("Candidate form")).toBeInTheDocument();
});
