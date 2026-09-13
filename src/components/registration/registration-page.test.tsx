import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { RegistrationPage } from "./registration-page";

function mount(accountType: "candidate" | "company") {
  const onAccountTypeChange = vi.fn();
  const view = render(
    <RegistrationPage
      accountType={accountType}
      onAccountTypeChange={onAccountTypeChange}
      candidate={<input aria-label="Candidate field" />}
      company={<input aria-label="Company field" />}
    />,
  );
  return { onAccountTypeChange, view };
}

it("shows the candidate side and asks to switch when Sou uma empresa is pressed", async () => {
  const { onAccountTypeChange } = mount("candidate");
  expect(screen.getByLabelText("Candidate field")).toBeVisible();
  expect(screen.getByLabelText("Company field")).not.toBeVisible();
  expect(
    screen.getByRole("button", { name: "Sou um candidato" }),
  ).toHaveAttribute("aria-pressed", "true");

  await userEvent.click(
    screen.getByRole("button", { name: "Sou uma empresa" }),
  );
  expect(onAccountTypeChange).toHaveBeenCalledWith("company");
});

it("shows the company side and asks to switch when Sou um candidato is pressed", async () => {
  const { onAccountTypeChange } = mount("company");
  expect(screen.getByLabelText("Company field")).toBeVisible();
  expect(screen.getByLabelText("Candidate field")).not.toBeVisible();
  expect(
    screen.getByRole("button", { name: "Sou uma empresa" }),
  ).toHaveAttribute("aria-pressed", "true");

  await userEvent.click(
    screen.getByRole("button", { name: "Sou um candidato" }),
  );
  expect(onAccountTypeChange).toHaveBeenCalledWith("candidate");
});

it("keeps what was typed on the hidden side when the tab changes", async () => {
  const { view } = mount("company");
  await userEvent.type(screen.getByLabelText("Company field"), "Minha Empresa");

  view.rerender(
    <RegistrationPage
      accountType="candidate"
      onAccountTypeChange={vi.fn()}
      candidate={<input aria-label="Candidate field" />}
      company={<input aria-label="Company field" />}
    />,
  );

  expect(screen.getByLabelText("Company field")).toHaveValue("Minha Empresa");
  expect(screen.getByLabelText("Company field")).not.toBeVisible();
});
