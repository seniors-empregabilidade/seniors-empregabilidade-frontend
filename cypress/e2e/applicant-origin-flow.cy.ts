// US-20-T03 browser flow across the company and professional screens. The fake
// API keeps one job and its professionals in memory and applies the backend rules
// (docs/JOBS.md in the backend): every application is listed with
// origin "application" and an application_type, a compatible profile without an
// application is an "automatic_match", the percentage depends only on the skills,
// and no row carries contact or identification data. PostgreSQL tests in the
// backend (tests/jobs/test_applicant_origin_end_to_end_integration.py) cover the
// real implementation.
const COMPANY_ID = "71000000-0000-4000-8000-000000000001";
const JOB_ID = "71000000-0000-4000-8000-000000000002";
const JOB_TITLE = "Auxiliar de loja";
const SKILLS = [
  {
    id: "72000000-0000-4000-8000-000000000001",
    name: "Atendimento ao cliente",
  },
  {
    id: "72000000-0000-4000-8000-000000000002",
    name: "Conferência de estoque",
  },
  { id: "72000000-0000-4000-8000-000000000003", name: "Planilhas" },
];
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

type Professional = {
  id: string;
  name: string;
  token: string;
  skillCount: number;
  application: { id: string; type: "active" | "automatic" } | null;
};

/** One professional per origin; Joana has not applied yet. */
function professionals(): Professional[] {
  return [
    {
      id: "73000000-0000-4000-8000-000000000001",
      name: "Marcos Ativo",
      token: "origin-marcos",
      skillCount: 3,
      application: {
        id: "74000000-0000-4000-8000-000000000001",
        type: "active",
      },
    },
    {
      id: "73000000-0000-4000-8000-000000000002",
      name: "Rita Automática",
      token: "origin-rita",
      skillCount: 3,
      application: {
        id: "74000000-0000-4000-8000-000000000002",
        type: "automatic",
      },
    },
    {
      id: "73000000-0000-4000-8000-000000000003",
      name: "Joana Sem Candidatura",
      token: "origin-joana",
      skillCount: 3,
      application: null,
    },
    {
      id: "73000000-0000-4000-8000-000000000004",
      name: "Pedro Parcial",
      token: "origin-pedro",
      skillCount: 2,
      application: null,
    },
  ];
}

function percentage(skillCount: number): string {
  return ((skillCount / SKILLS.length) * 100).toFixed(2);
}

function row(professional: Professional) {
  const matched = SKILLS.slice(0, professional.skillCount);
  const missing = SKILLS.slice(professional.skillCount);
  const application = professional.application;
  return {
    origin: application ? "application" : "automatic_match",
    application_id: application?.id ?? null,
    application_type: application?.type ?? null,
    status: application ? "under_review" : null,
    match_score: null,
    compatibility_percentage: percentage(professional.skillCount),
    is_highlighted: true,
    matched_skill_count: matched.length,
    required_skill_count: SKILLS.length,
    matched_skills: matched,
    missing_skills: missing,
    // The backend never sends contact or identification data, for any origin.
    profile: {
      candidate_id: professional.id,
      full_name: professional.name,
      city: "Porto Alegre",
      state: "RS",
    },
  };
}

function fakeApi() {
  const people = professionals();
  const byToken = (authorization: unknown) =>
    people.find((person) => authorization === `Bearer ${person.token}`);

  cy.intercept("GET", "**/auth/me", (request) => {
    const professional = byToken(request.headers.authorization);
    request.reply({
      statusCode: 200,
      body: professional
        ? { id: professional.id, user_type: "candidate", company_status: null }
        : { id: COMPANY_ID, user_type: "company", company_status: "approved" },
    });
  });
  cy.intercept("GET", "**/config/support", { statusCode: 404, body: {} });
  cy.intercept("GET", "**/jobs/me", {
    statusCode: 200,
    body: [
      {
        id: JOB_ID,
        company_id: COMPANY_ID,
        title: JOB_TITLE,
        description: "Vaga sintética.",
        skills: SKILLS.map((skill) => ({ ...skill, type: "hard" })),
        work_mode: "onsite",
        closing_date: "2099-12-31",
        status: "published",
        published_at: "2026-11-01T12:00:00Z",
        created_at: "2026-11-01T12:00:00Z",
        application_count: 2,
      },
    ],
  });
  // Ranked by percentage; equal percentages list applications first.
  cy.intercept("GET", `**/jobs/${JOB_ID}/applications`, (request) => {
    const rows = [...people]
      .sort(
        (left, right) =>
          right.skillCount - left.skillCount ||
          Number(right.application !== null) -
            Number(left.application !== null),
      )
      .map(row);
    const applications = rows.filter((item) => item.origin === "application");
    request.reply({
      statusCode: 200,
      body: {
        job_id: JOB_ID,
        total_applicant_count: applications.length,
        full_match_count: applications.filter(
          (item) => item.matched_skill_count === SKILLS.length,
        ).length,
        automatic_match_count: rows.length - applications.length,
        applicants: rows,
      },
    });
  }).as("professionals");
  cy.intercept("GET", `**/jobs/${JOB_ID}`, (request) => {
    const professional = byToken(request.headers.authorization);
    const applied = professional?.application != null;
    request.reply({
      statusCode: 200,
      body: {
        id: JOB_ID,
        title: JOB_TITLE,
        description: "Vaga sintética.",
        company_id: COMPANY_ID,
        company_name: "Empresa Sintética",
        skills: SKILLS.map((skill) => ({ ...skill, type: "hard" })),
        work_mode: "onsite",
        location: "Porto Alegre",
        closing_date: "2099-12-31",
        status: "published",
        published_at: "2026-11-01T12:00:00Z",
        already_applied: applied,
        is_open: true,
        is_expired: false,
        is_applicable: !applied,
      },
    });
  }).as("jobDetail");
  cy.intercept("POST", "**/applications", (request) => {
    const professional = byToken(request.headers.authorization);
    expect(request.body).to.deep.equal({ job_id: JOB_ID });
    if (!professional || professional.application) {
      request.reply({ statusCode: 409, body: { code: "already_applied" } });
      return;
    }
    professional.application = {
      id: "74000000-0000-4000-8000-000000000003",
      type: "active",
    };
    request.reply({
      statusCode: 201,
      body: {
        id: professional.application.id,
        job_id: JOB_ID,
        status: "under_review",
        submitted_at: "2026-11-09T12:00:00Z",
        matched_requirements: professional.skillCount,
        total_requirements: SKILLS.length,
      },
    });
  }).as("apply");
}

function visitAs(token: string, path: string) {
  cy.visit(path, {
    onBeforeLoad(window) {
      window.sessionStorage.setItem("seniors.access-token", token);
    },
  });
}

function rowOf(name: string) {
  return cy.contains("tbody tr", name);
}

function expectOrigin(name: string, label: string, percent: string) {
  rowOf(name).within(() => {
    cy.contains(label).should("be.visible");
    cy.contains(percent).should("be.visible");
  });
}

describe("origin of each professional in a job", () => {
  it("labels every origin, keeps the percentage when a match applies, and shows no contact data", () => {
    fakeApi();
    visitAs("origin-company", `/empresa/vagas/${JOB_ID}/candidatos`);
    cy.wait("@professionals");

    expectOrigin("Marcos Ativo", "Candidatou-se à vaga", "100%");
    expectOrigin("Rita Automática", "Candidatura automática", "100%");
    rowOf("Rita Automática")
      .contains("Candidatou-se à vaga")
      .should("not.exist");
    expectOrigin("Joana Sem Candidatura", "Match automático", "100%");
    expectOrigin("Pedro Parcial", "Match automático", "66,67%");
    cy.contains("button", "Candidaturas (2)").should("be.visible");
    cy.contains("button", "Matches automáticos (2)").should("be.visible");
    cy.get("main").should("not.contain.text", "@");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
    cy.get("table").scrollIntoView();
    cy.screenshot("us20-origin-ranking", { capture: "viewport" });

    // The management screen acts on applications only, of either type.
    cy.contains("a", "Gerenciar candidaturas desta vaga").click();
    cy.location("pathname").should("eq", "/empresa/candidatos");
    cy.contains(`Candidatos — ${JOB_TITLE}`).should("be.visible");
    cy.contains("2 perfis com match automático, sem candidatura.").should(
      "be.visible",
    );
    cy.contains("article", "Rita Automática").should(
      "contain.text",
      "Candidatura automática: a plataforma candidatou este profissional",
    );
    cy.contains("article", "Marcos Ativo").should(
      "not.contain.text",
      "Candidatura automática",
    );
    cy.contains("article", "Joana Sem Candidatura").should("not.exist");
    cy.get("article").should("have.length", 2);
    cy.get("article button")
      .filter(':contains("Ver perfil")')
      .should("have.length", 2);
    cy.checkA11y(undefined, WCAG);

    // Joana applies by herself from the job page.
    visitAs("origin-joana", `/candidato/vagas/${JOB_ID}`);
    cy.wait("@jobDetail");
    cy.contains("button", "Candidatar-se").click();
    cy.wait("@apply");
    cy.contains("Candidatura enviada").should("be.visible");
    cy.contains("button", "Já candidatado").should("be.disabled");

    // Back in the company session, Joana is an application with the same score.
    visitAs("origin-company", `/empresa/vagas/${JOB_ID}/candidatos`);
    cy.wait("@professionals");
    expectOrigin("Joana Sem Candidatura", "Candidatou-se à vaga", "100%");
    expectOrigin("Rita Automática", "Candidatura automática", "100%");
    cy.contains("button", "Candidaturas (3)").click();
    cy.get("tbody tr").should("have.length", 3);
    cy.contains("tbody tr", "Pedro Parcial").should("not.exist");
    cy.contains("button", "Matches automáticos (1)").click();
    cy.get("tbody tr").should("have.length", 1);
    expectOrigin("Pedro Parcial", "Match automático", "66,67%");
  });

  it("keeps the origin labels readable on a phone", () => {
    cy.viewport(390, 844);
    fakeApi();
    visitAs("origin-company", `/empresa/vagas/${JOB_ID}/candidatos`);
    cy.wait("@professionals");
    expectOrigin("Rita Automática", "Candidatura automática", "100%");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
    rowOf("Rita Automática").scrollIntoView();
    cy.screenshot("us20-origin-mobile", { capture: "viewport" });
  });
});
