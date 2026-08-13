import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders an accessible button and handles activation", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Continuar</Button>);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not handle activation while disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Continuar
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
