import { describe, expect, it } from "vitest";

import { requirementCountLabel } from "./requirement-count";

describe("requirementCountLabel", () => {
  it.each([
    [0, 1, "0 de 1 requisito"],
    [1, 1, "1 de 1 requisito"],
    [0, 3, "0 de 3 requisitos"],
    [2, 3, "2 de 3 requisitos"],
  ])("labels %i met out of %i as %s", (matched, total, label) => {
    expect(requirementCountLabel(matched, total)).toBe(label);
  });
});
