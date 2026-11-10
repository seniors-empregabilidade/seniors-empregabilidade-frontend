import { describe, expect, it } from "vitest";

import { safeExternalUrl } from "./safe-external-url";

describe("safeExternalUrl", () => {
  it("accepts an absolute http or https URL and returns the parsed form", () => {
    expect(safeExternalUrl("https://example.com/nr-11")).toBe(
      "https://example.com/nr-11",
    );
    expect(safeExternalUrl("  http://example.com/curso  ")).toBe(
      "http://example.com/curso",
    );
    expect(safeExternalUrl("https://example.com/a b")).toBe(
      "https://example.com/a%20b",
    );
  });

  it("refuses URLs that are not an absolute http(s) address", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("/candidato/perfil")).toBeNull();
    expect(safeExternalUrl("//example.com/curso")).toBeNull();
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,hi")).toBeNull();
    expect(safeExternalUrl("vbscript:msg")).toBeNull();
    expect(safeExternalUrl("file:///tmp/curso")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
  });

  it("refuses URLs that carry credentials", () => {
    expect(safeExternalUrl("https://user:secret@example.com/curso")).toBeNull();
    expect(safeExternalUrl("https://:secret@example.com/curso")).toBeNull();
  });
});
