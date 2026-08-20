import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders the success variant with the success background class", () => {
    render(<Badge variant="success">Aprovado</Badge>);

    const badge = screen.getByText("Aprovado");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-success");
  });

  it("renders the warning variant with the warning background class", () => {
    render(<Badge variant="warning">Pendente</Badge>);

    const badge = screen.getByText("Pendente");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-warning");
  });

  it("renders the default variant when no variant is given", () => {
    render(<Badge>Novo</Badge>);

    const badge = screen.getByText("Novo");
    expect(badge).toHaveClass("bg-primary");
    expect(badge).not.toHaveClass("bg-success");
  });
});
