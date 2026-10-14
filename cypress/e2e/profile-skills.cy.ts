import type * as axe from "axe-core";

type Skill = { id: string; name: string; type: "hard" | "soft" };

const candidateId = "00000000-0000-4000-8000-000000000001";
const leadership: Skill = {
  id: "50000000-0000-4000-8000-000000000001",
  name: "Liderança",
  type: "soft",
};
const negotiation: Skill = {
  id: "50000000-0000-4000-8000-000000000002",
  name: "Negociação",
  type: "soft",
};
const excel: Skill = {
  id: "50000000-0000-4000-8000-000000000003",
  name: "Excel",
  type: "hard",
};
const catalog = [excel, leadership, negotiation];
const wcag = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

// Fail with each rule, reason and element, so a failure seen only in CI
// explains itself in the job output.
function reportViolations(violations: axe.Result[]): void {
  throw new Error(
    violations
      .map((violation) =>
        [
          `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}`,
          ...violation.nodes.map((node) =>
            [
              `  target: ${node.target.join(" ")}`,
              `  ${node.failureSummary ?? ""}`,
              `  html: ${node.html.slice(0, 200)}`,
            ].join("\n"),
          ),
        ].join("\n"),
      )
      .join("\n\n"),
  );
}

function comparable(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

describe("résumé skill selection", () => {
  beforeEach(() => {
    let skills = [leadership];
    const profile = () => ({
      id: candidateId,
      full_name: "Pessoa Sintética",
      age: 58,
      email: "candidate@example.invalid",
      phone: "11999990000",
      city: "Porto Alegre",
      state: "RS",
      summary: null,
      experiences: [],
      education: [],
      skills,
    });

    cy.intercept("POST", "**/auth/login", {
      body: {
        access_token: "synthetic-access",
        id_token: "synthetic-id",
        refresh_token: null,
        expires_in: 900,
        token_type: "Bearer",
        user_id: candidateId,
        user_type: "candidate",
      },
    });
    cy.intercept("GET", "**/auth/me", {
      body: { id: candidateId, user_type: "candidate", company_status: null },
    });
    cy.intercept("GET", "**/professionals/me", (req) => {
      req.reply(profile());
    }).as("profile");
    cy.intercept({ method: "GET", pathname: "**/skills" }, (req) => {
      const search = comparable(String(req.query.search ?? ""));
      req.reply(
        catalog.filter((skill) => comparable(skill.name).includes(search)),
      );
    }).as("catalog");
    cy.intercept("POST", "**/professionals/me/skills", (req) => {
      const { skill_id } = req.body as { skill_id: string };
      const linked = catalog.find((skill) => skill.id === skill_id);
      if (linked) {
        skills = [...skills, linked];
      }
      req.reply({ statusCode: 201, body: linked });
    }).as("link");
    cy.intercept("DELETE", "**/professionals/me/skills/*", (req) => {
      skills = skills.filter((skill) => !req.url.endsWith(skill.id));
      req.reply({ statusCode: 204 });
    }).as("unlink");
    cy.intercept("PATCH", "**/professionals/me", (req) => {
      req.reply({ ...profile(), ...(req.body as object) });
    }).as("save");

    cy.visit("/login");
    cy.get("#email").type("candidate@example.invalid");
    cy.get("#password").type("SyntheticTest123!");
    cy.contains("button", "Entrar").click();
    cy.contains("a", "Meu perfil").click();
    cy.wait("@profile");
    cy.contains("button", "Editar perfil").click();
    cy.wait("@catalog");
  });

  it("picks several catalog skills and saves them with the résumé", () => {
    cy.get('[role="dialog"]').should("have.css", "opacity", "1");
    cy.injectAxe();
    cy.checkA11y('[role="dialog"]', wcag, reportViolations);

    cy.get('[aria-label="Catálogo de habilidades"]').within(() => {
      cy.contains("button", "Liderança").should(
        "have.attr",
        "aria-pressed",
        "true",
      );
      cy.contains("button", "Negociação").click();
      cy.contains("button", "Negociação").should(
        "have.attr",
        "aria-pressed",
        "true",
      );
    });
    cy.get('[role="dialog"]').contains("label", "Buscar no catálogo").click();
    cy.focused().type("excel");
    cy.contains('[role="status"]', "1 habilidade encontrada.");
    cy.get('[aria-label="Catálogo de habilidades"]')
      .contains("button", "Excel")
      .click();
    cy.get('[aria-label="Remover habilidade Liderança"]').click();
    cy.contains("Selecionadas (2)").should("be.visible");
    cy.checkA11y('[role="dialog"]', wcag, reportViolations);
    cy.get("@link.all").should("have.length", 0);
    cy.get("@unlink.all").should("have.length", 0);

    cy.contains("button", "Salvar alterações").click();

    cy.wait("@unlink");
    cy.wait(["@link", "@link"]);
    cy.wait("@save");
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("h3", "Habilidades")
      .parent()
      .within(() => {
        cy.contains("Negociação").should("be.visible");
        cy.contains("Excel").should("be.visible");
        cy.contains("Liderança").should("not.exist");
      });
  });

  it("discards the selection when the edit is cancelled", () => {
    cy.get('[aria-label="Catálogo de habilidades"]')
      .contains("button", "Excel")
      .click();
    cy.contains("button", "Cancelar").click();

    cy.get('[role="dialog"]').should("not.exist");
    cy.get("@link.all").should("have.length", 0);
    cy.contains("h3", "Habilidades")
      .parent()
      .within(() => {
        cy.contains("Liderança").should("be.visible");
        cy.contains("Excel").should("not.exist");
      });
  });
});
