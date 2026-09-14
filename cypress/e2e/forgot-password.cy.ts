const EMAIL = "candidato@exemplo.invalid";
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

function stubSend(statusCode: number, body: unknown = "") {
  cy.intercept("POST", "**/password-reset/send", {
    statusCode,
    body,
    headers: { "content-type": "application/problem+json" },
  }).as("send");
}

describe("forgot password screen", () => {
  it("goes back to the login screen", () => {
    cy.visit("/forgot-password");

    cy.contains("a", "Voltar para o login").click();
    cy.location("pathname").should("eq", "/login");
  });

  it("validates an empty and then an invalid e-mail before calling the API", () => {
    stubSend(202);
    cy.visit("/forgot-password");

    cy.contains("button", "Enviar").click();
    cy.contains("Informe um e-mail válido.").should("be.visible");

    cy.get("#email").type("invalido");
    cy.contains("button", "Enviar").click();
    cy.contains("Informe um e-mail válido.").should("be.visible");

    cy.get("@send.all").should("have.length", 0);
  });

  it("sends the address and confirms without claiming the account exists", () => {
    stubSend(202);
    cy.visit("/forgot-password");

    cy.get("#email").type(EMAIL);
    cy.contains("button", "Enviar").click();

    cy.wait("@send").its("request.body").should("deep.equal", { email: EMAIL });
    cy.get('[role="dialog"]').should("be.visible");
    cy.contains("Se houver uma conta com esse e-mail").should("be.visible");
  });

  it("carries the address to the reset screen", () => {
    stubSend(202);
    cy.visit("/forgot-password");

    cy.get("#email").type(EMAIL);
    cy.contains("button", "Enviar").click();
    cy.contains("button", "Inserir código").click();

    cy.location("pathname").should("eq", "/reset-password");
    cy.get("#email").should("have.value", EMAIL);
  });

  it("reports throttling without opening the confirmation dialog", () => {
    stubSend(429, {
      title: "Too Many Requests",
      status: 429,
      detail: "Too many attempts. Try again later.",
      code: "too_many_attempts",
    });
    cy.visit("/forgot-password");

    cy.get("#email").type(EMAIL);
    cy.contains("button", "Enviar").click();

    cy.contains("Muitas tentativas").should("be.visible");
    cy.contains("Too many attempts").should("not.exist");
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("traps focus inside the dialog and restores it to the submit button on close", () => {
    stubSend(202);
    cy.visit("/forgot-password");

    cy.get("#email").type(EMAIL);
    cy.contains("button", "Enviar").as("submitButton").click();

    cy.get('[role="dialog"]').should("be.visible");
    cy.contains("button", "Inserir código").should("be.focused");

    cy.realPress("Tab");
    cy.contains("button", "Inserir código").should("be.focused");

    cy.realPress("Escape");
    cy.get('[role="dialog"]').should("not.exist");
    cy.get("@submitButton").should("be.focused");
  });

  it("has no detectable WCAG 2.2 AA violations", () => {
    cy.visit("/forgot-password");
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });

  it("has no detectable WCAG 2.2 AA violations with the dialog open", () => {
    stubSend(202);
    cy.visit("/forgot-password");

    cy.get("#email").type(EMAIL);
    cy.contains("button", "Enviar").click();
    cy.get('[role="dialog"]').should("be.visible");

    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });
});
