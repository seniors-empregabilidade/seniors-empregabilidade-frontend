const course = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "NR-11: movimentação de cargas",
  institution: "SENAI",
  mode: "onsite",
  external_link: "https://example.com/nr-11",
  skills: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Operação de empilhadeira",
      type: "hard",
    },
  ],
};

const unsafeCourse = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Curso sem link seguro",
  institution: "SENAC",
  mode: "online",
  external_link: "javascript:alert(1)",
  skills: [],
};

// Same shape as `GET /trainings`: one page of courses and the total matches.
function coursePage(items: (typeof course | typeof unsafeCourse)[]) {
  return { items, total: items.length };
}

const wcag = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

function visitCourseSearch(): void {
  cy.intercept("GET", "**/auth/me", {
    body: {
      id: "77777777-7777-4777-8777-777777777777",
      user_type: "candidate",
      company_status: null,
    },
  }).as("currentUser");

  cy.visit("/candidato/capacitacao", {
    onBeforeLoad(window) {
      window.sessionStorage.setItem("seniors.access-token", "e2e-access-token");
    },
  });
  cy.wait("@currentUser");
}

describe("course search", () => {
  it("filters courses by skill and opens a safe external link", () => {
    cy.intercept("GET", "**/api/v1/trainings*", (request) => {
      const skill = new URL(request.url).searchParams.get("skill");
      request.reply({
        body: coursePage(skill === "Excel" ? [] : [course, unsafeCourse]),
      });
    }).as("courses");

    visitCourseSearch();
    cy.wait("@courses");

    cy.contains("h1", "Capacitação").should("be.visible");
    cy.contains("a", "Capacitação").should("have.attr", "aria-current", "page");
    cy.contains("NR-11: movimentação de cargas").should("be.visible");
    cy.contains("SENAI · Presencial").should("be.visible");
    cy.contains("Habilidades: Operação de empilhadeira").should("be.visible");
    cy.contains("SENAC · Online").should("be.visible");
    cy.contains("O link deste curso não está disponível.").should("be.visible");

    cy.contains("a", "Acessar curso")
      .should("have.attr", "href", "https://example.com/nr-11")
      .and("have.attr", "target", "_blank")
      .and("have.attr", "rel", "noopener noreferrer");

    cy.get("#root").then((root) => {
      expect(root.html()).not.to.contain("javascript:");
    });

    cy.contains("label", "Buscar por habilidade")
      .invoke("attr", "for")
      .then((id) => {
        cy.get(`[id="${id ?? ""}"]`).type("Excel");
      });
    cy.wait("@courses");
    cy.contains("Nenhum curso encontrado para “Excel”.").should("be.visible");
  });

  it("recovers from a failed load", () => {
    let failed = false;
    cy.intercept("GET", "**/api/v1/trainings*", (request) => {
      if (!failed) {
        failed = true;
        request.reply({
          statusCode: 500,
          body: { title: "Error", status: 500 },
        });
        return;
      }
      request.reply({ body: coursePage([course]) });
    }).as("courses");

    visitCourseSearch();
    cy.wait("@courses");
    cy.contains("Não foi possível carregar os cursos. Tente novamente.").should(
      "be.visible",
    );

    cy.contains("button", "Tentar novamente").click();
    cy.wait("@courses");
    cy.contains("NR-11: movimentação de cargas").should("be.visible");
  });

  it("has no detectable WCAG 2.2 AA violations", () => {
    cy.intercept("GET", "**/api/v1/trainings*", {
      body: coursePage([course]),
    }).as("courses");
    visitCourseSearch();
    cy.wait("@courses");
    cy.contains("NR-11: movimentação de cargas").should("be.visible");
    cy.injectAxe();
    cy.checkA11y(undefined, wcag);
  });
});
