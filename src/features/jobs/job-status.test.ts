import { describe, expect, it } from "vitest";

import {
  applicationCountLabel,
  isOpenToCandidates,
  jobStatusLabel,
  needsNewClosingDate,
  statusActionFor,
} from "./job-status";

const TODAY = "2026-09-29";

describe("job status rules", () => {
  it.each([
    ["published", "2026-09-29", true, "close", "Aberta"],
    ["published", "2026-09-28", false, "reopen", "Prazo encerrado"],
    ["closed", "2026-12-31", false, "reopen", "Encerrada"],
    ["paused", "2026-12-31", false, "reopen", "Pausada"],
    ["expired", "2026-09-01", false, "reopen", "Expirada"],
    ["draft", "2026-12-31", false, null, "Rascunho"],
    ["under_review", "2026-12-31", false, null, "Em análise"],
  ] as const)(
    "a %s job closing on %s: open=%s, action=%s, label=%s",
    (status, closingDate, open, action, label) => {
      const job = { status, closing_date: closingDate };

      expect(isOpenToCandidates(job, TODAY)).toBe(open);
      expect(statusActionFor(job, TODAY)).toBe(action);
      expect(jobStatusLabel(job, TODAY)).toBe(label);
    },
  );

  it("asks for a new closing date only once the current one has passed", () => {
    expect(
      needsNewClosingDate(
        { status: "closed", closing_date: "2026-09-28" },
        TODAY,
      ),
    ).toBe(true);
    expect(
      needsNewClosingDate(
        { status: "closed", closing_date: "2026-09-29" },
        TODAY,
      ),
    ).toBe(false);
  });

  it.each([
    [0, "Nenhuma candidatura ainda"],
    [1, "1 candidatura"],
    [12, "12 candidaturas"],
  ])("describes %i applications", (count, label) => {
    expect(applicationCountLabel(count)).toBe(label);
  });
});
