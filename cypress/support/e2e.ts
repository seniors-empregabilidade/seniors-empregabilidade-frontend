import "cypress-axe";
import "cypress-real-events/support";

import type { Result } from "axe-core";

// cypress-axe reports violations only in the interactive command log, so a
// failing headless run (CI) says "1 accessibility violation" without naming
// it. Print each one to the terminal before the assertion fails.
function reportViolations(violations: Result[]): void {
  const lines = violations.flatMap((violation) => [
    `axe ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}`,
    ...violation.nodes.map((node) => `  at ${node.target.join(" ")}`),
  ]);
  cy.task("log", lines.join("\n"), { log: false });
}

Cypress.Commands.overwrite(
  "checkA11y",
  (checkA11y, context, options, violationCallback, skipFailures) =>
    checkA11y(
      context,
      options,
      violationCallback ?? reportViolations,
      skipFailures,
    ),
);
