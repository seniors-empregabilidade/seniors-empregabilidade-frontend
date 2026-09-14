import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingEmail,
  PENDING_EMAIL_KEY,
  readPendingEmail,
  writePendingEmail,
} from "./pending-email";

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("pending verification storage", () => {
  it("stores only the email and resend deadline, never the code", () => {
    expect(readPendingEmail()).toBeNull();
    writePendingEmail("pessoa@example.com", 12345);
    expect(readPendingEmail()).toEqual({
      email: "pessoa@example.com",
      resendAvailableAt: 12345,
    });
    expect(window.sessionStorage.getItem(PENDING_EMAIL_KEY)).toBe(
      JSON.stringify({ email: "pessoa@example.com", resendAvailableAt: 12345 }),
    );
    window.sessionStorage.setItem("unrelated", "preserve");
    clearPendingEmail();
    expect(readPendingEmail()).toBeNull();
    expect(window.sessionStorage.getItem("unrelated")).toBe("preserve");
  });

  it.each([
    "not json",
    "null",
    "4",
    "{}",
    '{"email":4,"resendAvailableAt":0}',
    '{"email":"pessoa@example.com","resendAvailableAt":1e309}',
  ])("ignores malformed stored context: %s", (value) => {
    window.sessionStorage.setItem(PENDING_EMAIL_KEY, value);
    expect(readPendingEmail()).toBeNull();
  });

  it.each(["getItem", "setItem", "removeItem"] as const)(
    "tolerates failing %s",
    (method) => {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error("blocked");
      });
      expect(() => writePendingEmail("pessoa@example.com")).not.toThrow();
      expect(() => readPendingEmail()).not.toThrow();
      expect(() => clearPendingEmail()).not.toThrow();
    },
  );

  it("tolerates unavailable sessionStorage", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readPendingEmail()).toBeNull();
    expect(() => writePendingEmail("pessoa@example.com")).not.toThrow();
    expect(() => clearPendingEmail()).not.toThrow();
  });
});
