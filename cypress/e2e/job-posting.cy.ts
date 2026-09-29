const COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

const catalogSkill = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Gestão de equipes",
  type: "soft",
};

const published = {
  id: "22222222-2222-4222-8222-222222222222",
  company_id: COMPANY_ID,
  title: "Analista de operações",
  description: "Vaga sintética para o teste de ponta a ponta.",
  skills: [
    { id: "44444444-4444-4444-8444-444444444444", name: "Excel", type: "hard" },
    catalogSkill,
  ],
  work_mode: "hybrid",
  closing_date: "2099-12-31",
  status: "published",
  published_at: "2026-09-23T12:00:00Z",
  created_at: "2026-09-23T12:00:00Z",
};

function signInAsApprovedCompany(): void {
  cy.intercept("POST", "**/auth/login", {
    statusCode: 200,
    body: {
      access_token: "e2e-access-token",
      id_token: "e2e-id-token",
      refresh_token: null,
      expires_in: 900,
      token_type: "Bearer",
      user_id: COMPANY_ID,
      user_type: "company",
    },
  }).as("login");
  cy.intercept("GET", "**/auth/me", {
    statusCode: 200,
    body: { id: COMPANY_ID, user_type: "company", company_status: "approved" },
  });
  cy.intercept(
    { method: "GET", pathname: "/api/v1/skills" },
    { statusCode: 200, body: [catalogSkill] },
  ).as("skills");

  cy.visit("/login");
  cy.get("#email").type("empresa@exemplo.com");
  cy.get("#password").type("senha-sintetica");
  cy.contains("button", "Entrar").click();
  cy.wait("@login");
}

function openMyJobs(): void {
  cy.contains("a", "Minhas vagas").click();
  cy.location("pathname").should("eq", "/empresa/vagas");
  cy.contains("Você ainda não publicou vagas").should("be.visible");
}

function skillsInput(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .contains("label", "Habilidades necessárias")
    .invoke("attr", "for")
    .then((id) => cy.get(`[id="${id}"]`));
}

function fillTheJob(): void {
  cy.get("#job-title").type(published.title);
  cy.get("#job-description").type(published.description);
  cy.contains("label", "Híbrido").click();
  cy.get("#job-closing-date").type(published.closing_date);
  skillsInput().type("Excel{enter}");
  skillsInput().type("gest");
  cy.wait("@skills");
  cy.contains("button", "Gestão de equipes").click();
}

describe("job posting", () => {
  it("publishes a job that then appears in Minhas vagas", () => {
    let stored: object[] = [];
    cy.intercept({ method: "GET", pathname: "/api/v1/jobs/me" }, (request) =>
      request.reply({ statusCode: 200, body: stored }),
    ).as("myJobs");
    cy.intercept({ method: "POST", pathname: "/api/v1/jobs" }, (request) => {
      stored = [published];
      request.reply({ statusCode: 201, body: published });
    }).as("createJob");

    signInAsApprovedCompany();
    openMyJobs();
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);

    cy.contains("button", "Cadastrar nova vaga").click();
    // axe measures contrast mid fade-in otherwise.
    cy.get('[role="dialog"]').should("have.css", "opacity", "1");
    cy.contains("button", "Publicar vaga").click();
    cy.get("#job-title-error").should("have.text", "Preencha este campo.");
    cy.contains("Adicione pelo menos uma habilidade.")
      .scrollIntoView()
      .should("be.visible");
    cy.get("@createJob.all").should("have.length", 0);
    cy.checkA11y(undefined, WCAG);

    fillTheJob();
    cy.contains("button", "Publicar vaga").click();

    cy.wait("@createJob")
      .its("request.body")
      .should("deep.equal", {
        title: published.title,
        description: published.description,
        skills: [
          { name: "Excel", type: "hard" },
          { name: "Gestão de equipes", type: "soft" },
        ],
        work_mode: "hybrid",
        closing_date: "2099-12-31",
      });
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("foi publicada e já aparece na lista").should("be.visible");
    cy.contains("article", published.title).within(() => {
      cy.contains("Aberta").should("be.visible");
      cy.contains("Híbrido · Encerra em 31/12/2099").should("be.visible");
      cy.contains("li", "Gestão de equipes").should("be.visible");
    });
    cy.checkA11y(undefined, WCAG);
  });

  it("keeps the entered job and an unchanged list when the server fails", () => {
    cy.intercept(
      { method: "GET", pathname: "/api/v1/jobs/me" },
      { statusCode: 200, body: [] },
    ).as("myJobs");
    cy.intercept(
      { method: "POST", pathname: "/api/v1/jobs" },
      {
        statusCode: 500,
        headers: { "content-type": "application/problem+json" },
        body: {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred.",
          code: "internal_error",
        },
      },
    ).as("createJob");

    signInAsApprovedCompany();
    openMyJobs();
    cy.contains("button", "Cadastrar nova vaga").click();
    fillTheJob();
    cy.contains("button", "Publicar vaga").click();
    cy.wait("@createJob");

    cy.contains(
      "Não foi possível publicar a vaga. Seus dados foram mantidos; tente novamente.",
    ).should("be.visible");
    cy.get("#job-title").should("have.value", published.title);
    cy.contains("An unexpected error occurred.").should("not.exist");

    cy.contains("button", "Cancelar").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("Você ainda não publicou vagas").should("be.visible");
    cy.get("article").should("not.exist");
  });
});
