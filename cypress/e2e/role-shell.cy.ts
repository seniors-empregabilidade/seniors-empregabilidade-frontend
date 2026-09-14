const USER_ID = "11111111-1111-4111-8111-111111111111";
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

function stubSignIn(userType: string): void {
  cy.intercept("POST", "**/auth/login", {
    statusCode: 200,
    body: {
      access_token: "e2e-access-token",
      id_token: "e2e-id-token",
      refresh_token: null,
      expires_in: 900,
      token_type: "Bearer",
      user_id: USER_ID,
      user_type: userType,
    },
  }).as("login");

  cy.intercept("GET", "**/auth/me", {
    statusCode: 200,
    body: { id: USER_ID, user_type: userType, company_status: null },
  }).as("currentUser");
}

function signIn(userType: string): void {
  stubSignIn(userType);
  cy.visit("/login");
  cy.get("#email").type("pessoa@exemplo.com");
  cy.get("#password").type("senha-sintetica");
  cy.contains("button", "Entrar").click();
  cy.wait("@login");
}

describe("role area shell", () => {
  it("shows the candidate sidebar and the greeting header", () => {
    signIn("candidate");

    cy.get("aside").within(() => {
      cy.contains("Seniors").should("be.visible");
      cy.contains("Área do candidato").should("be.visible");
      cy.contains("button", "Sair").should("be.visible");
    });
    cy.contains("Olá!").should("be.visible");
    cy.contains("Notificações").should("be.visible");
    cy.contains("Suporte no WhatsApp").should("be.visible");
  });

  it("shows the company sidebar without the greeting header", () => {
    signIn("company");

    cy.get("aside").within(() => {
      cy.contains("Área da empresa").should("be.visible");
      cy.contains("button", "Sair").should("be.visible");
    });
    cy.contains("Olá!").should("not.exist");
  });

  it("shows the administrator sidebar without the greeting header", () => {
    signIn("administrator");

    cy.get("aside").within(() => {
      cy.contains("Administração").should("be.visible");
      cy.contains("button", "Sair").should("be.visible");
    });
    cy.contains("Olá!").should("not.exist");
  });

  it("signs out back to the login screen", () => {
    signIn("candidate");

    cy.contains("button", "Sair").click();

    cy.location("pathname").should("eq", "/login");
    cy.visit("/candidato");
    cy.location("pathname").should("eq", "/login");
  });

  it("reflows without horizontal scroll at 320px (WCAG 1.4.10)", () => {
    cy.viewport(320, 720);
    signIn("candidate");

    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(320);
    });

    // A real (non-forced) click fails if the floating support button visually
    // covers "Sair" — exactly the overlap this guards against.
    cy.contains("button", "Sair").click();
    cy.location("pathname").should("eq", "/login");
  });

  it("has no detectable WCAG 2.2 AA violations on the candidate shell", () => {
    signIn("candidate");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });

  it("has no detectable WCAG 2.2 AA violations on the company shell", () => {
    signIn("company");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });

  it("has no detectable WCAG 2.2 AA violations on the administrator shell", () => {
    signIn("administrator");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });
});
