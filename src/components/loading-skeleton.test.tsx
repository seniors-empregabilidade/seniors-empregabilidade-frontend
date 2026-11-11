import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingSkeleton } from "./loading-skeleton";

describe("LoadingSkeleton", () => {
  it("announces what is loading in a status region", () => {
    render(<LoadingSkeleton label="Carregando contas…" className="mt-8" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Carregando contas…");
    expect(status).toHaveClass("mt-8");
  });
});
