import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SupportWhatsAppButton } from "./support-whatsapp-button";

describe("SupportWhatsAppButton", () => {
  it("renders as static text, not as a control, until it has a real link", () => {
    render(<SupportWhatsAppButton />);

    expect(screen.getByText("Suporte no WhatsApp")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Suporte no WhatsApp" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Suporte no WhatsApp" }),
    ).not.toBeInTheDocument();
  });
});
