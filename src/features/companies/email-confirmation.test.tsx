import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";

import { confirmCompanyEmail, resendCompanyCode } from "./company-api";
import { EmailConfirmation } from "./email-confirmation";

vi.mock("./company-api", () => ({
  confirmCompanyEmail: vi.fn(),
  resendCompanyCode: vi.fn(),
}));
beforeEach(() => {
  vi.resetAllMocks();
});
function mount() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EmailConfirmation email="test@synthetic.invalid" />
    </QueryClientProvider>,
  );
}
it("keeps an invalid code editable and allows generic resend", async () => {
  vi.mocked(confirmCompanyEmail).mockRejectedValueOnce(
    new ApiError({ message: "Invalid", code: "invalid_verification_code" }),
  );
  vi.mocked(resendCompanyCode).mockResolvedValue(undefined);
  mount();
  expect(
    screen.getByRole("button", { name: "Confirmar e-mail" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Código de confirmação"), {
    target: { value: "123456" },
  });
  await userEvent.click(
    screen.getByRole("button", { name: "Confirmar e-mail" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível confirmar",
  );
  expect(screen.getByLabelText("Código de confirmação")).toHaveValue("123456");
  await userEvent.click(
    screen.getByRole("button", { name: "Reenviar código" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Se houver uma confirmação pendente",
  );
});
it("shows resend failure without claiming an email was sent", async () => {
  vi.mocked(resendCompanyCode).mockRejectedValue(
    new ApiError({ message: "Throttled", code: "too_many_attempts" }),
  );
  mount();
  await userEvent.click(
    screen.getByRole("button", { name: "Reenviar código" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Houve muitas tentativas",
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
