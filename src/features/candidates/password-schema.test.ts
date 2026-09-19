import { describe, expect, it } from "vitest";
import { passwordSchema } from "./password-schema";

describe("registration password policy", () => {
  it.each([
    ["Aa1!abc", "8 caracteres"],
    ["synthetic123!", "maiúscula"],
    ["SYNTHETIC123!", "minúscula"],
    ["Synthetic!", "número"],
    ["Synthetic123", "símbolo"],
    ["Synthetic123 ", "símbolo"],
  ])("rejects %s when missing %s", (password, requirement) => {
    const parsed = passwordSchema.safeParse(password);
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues[0]?.message).toContain(requirement);
  });

  it.each(["Aa1!abcd", "Synthetic123!", "Synthetic123_", "Synthetic123="])(
    "accepts a compliant synthetic password",
    (password) => {
      expect(passwordSchema.parse(password)).toBe(password);
    },
  );
});
