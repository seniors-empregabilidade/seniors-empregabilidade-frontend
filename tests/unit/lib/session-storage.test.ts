import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSession,
  readAccessToken,
  writeAccessToken,
} from "@/lib/session-storage";

afterEach(() => {
  vi.restoreAllMocks();
  clearSession();
});

function blockStorage(): void {
  vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
    throw new Error("storage is blocked");
  });
}

describe("session storage", () => {
  it("reports no token before anyone signs in", () => {
    expect(readAccessToken()).toBeNull();
  });

  it("keeps the token available until the session is cleared", () => {
    writeAccessToken("access-token-value");
    expect(readAccessToken()).toBe("access-token-value");

    clearSession();
    expect(readAccessToken()).toBeNull();
  });

  it("keeps the token out of localStorage, which outlives the tab", () => {
    writeAccessToken("access-token-value");

    expect(window.sessionStorage.getItem("seniors.access-token")).toBe(
      "access-token-value",
    );
    expect(window.localStorage.length).toBe(0);
  });

  it("behaves like a signed-out visitor when the browser blocks storage", () => {
    blockStorage();

    expect(() => {
      writeAccessToken("access-token-value");
    }).not.toThrow();
    expect(readAccessToken()).toBeNull();
    expect(() => {
      clearSession();
    }).not.toThrow();
  });
});
