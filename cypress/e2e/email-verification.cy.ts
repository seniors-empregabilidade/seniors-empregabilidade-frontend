const pendingKey = "seniors.pending-verification-email";
const axeOptions = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

describe("email verification", () => {
  it("sends from direct entry, counts down, resends and confirms without exposing personal data", () => {
    cy.intercept("POST", "**/api/v1/email-verification/send", {
      statusCode: 202,
      body: "",
    }).as("sendCode");
    cy.intercept("POST", "**/api/v1/email-verification/confirm", {
      statusCode: 422,
      headers: { "content-type": "application/problem+json" },
      body: {
        title: "Validation Error",
        status: 422,
        code: "invalid_verification_code",
        detail: "PRIVATE",
        errors: { code: ["PRIVATE"] },
      },
    }).as("invalidCode");
    cy.visit("/email-verification");
    cy.clock(Date.now(), ["Date", "setInterval", "clearInterval"]);
    cy.injectAxe();
    cy.checkA11y(undefined, axeOptions);
    cy.get("#verification-code").should("not.exist");
    cy.contains("Você pode colar").should("not.exist");
    cy.get("#verification-email")
      .should("have.attr", "autocomplete", "email")
      .type("pessoa@example.com");
    cy.contains("button", "Enviar código").click();
    cy.wait("@sendCode")
      .its("request.body")
      .should("deep.equal", { email: "pessoa@example.com" });
    cy.get("#verification-email").should("not.exist");
    cy.contains("p***@e***.com").should("be.visible");
    cy.get("body").should("not.contain.text", "pessoa@example.com");
    cy.get('[role="status"]').should(
      "contain.text",
      "Se este e-mail estiver cadastrado",
    );
    cy.get("#resend-help").should(
      "have.text",
      "Não recebeu o código? Confira o e-mail informado e a pasta de spam.",
    );
    cy.get("#resend-countdown")
      .should("have.text", "Você pode solicitar outro código em 60 segundos.")
      .and("not.have.attr", "aria-hidden");
    cy.contains("button", "Reenviar código")
      .should("be.disabled")
      .and("have.attr", "aria-describedby", "resend-help resend-countdown");
    cy.contains("button", "Confirmar e-mail").should("be.enabled");
    cy.contains("Use o código do e-mail mais recente.").should("not.exist");
    cy.checkA11y(undefined, axeOptions);
    cy.tick(1000);
    cy.get("#resend-countdown").should(
      "have.text",
      "Você pode solicitar outro código em 59 segundos.",
    );
    cy.get('[role="status"]').should("not.contain.text", "segundos");
    cy.get("#verification-code")
      .should("have.attr", "autocomplete", "one-time-code")
      .type("000000");
    cy.contains("button", "Confirmar e-mail").click();
    cy.wait("@invalidCode")
      .its("request.body")
      .should("deep.equal", { email: "pessoa@example.com", code: "000000" });
    cy.get("#verification-code")
      .should("be.focused")
      .and("have.attr", "aria-describedby", "verification-code-error");
    cy.get('[role="alert"]').should("contain.text", "incorreto ou expirou");
    cy.contains("PRIVATE").should("not.exist");
    cy.checkA11y(undefined, axeOptions);
    cy.tick(58_000);
    cy.get("#resend-countdown").should(
      "have.text",
      "Você pode solicitar outro código em 1 segundo.",
    );
    cy.contains("button", "Reenviar código").should("be.disabled");
    cy.tick(1000);
    cy.get("#resend-countdown").should("not.exist");
    cy.contains("Você já pode pedir outro código").should("not.exist");
    cy.contains("button", "Reenviar código")
      .should("be.enabled")
      .and("have.attr", "aria-describedby", "resend-help")
      .click();
    cy.wait("@sendCode");
    cy.get("#resend-countdown").should(
      "have.text",
      "Você pode solicitar outro código em 60 segundos.",
    );
    cy.intercept("POST", "**/api/v1/email-verification/confirm", {
      statusCode: 204,
      body: "",
    }).as("confirmCode");
    cy.get("#verification-code").clear().type("123456");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(pendingKey)).not.to.contain("123456");
    });
    cy.contains("button", "Confirmar e-mail").click();
    cy.wait("@confirmCode")
      .its("request.body")
      .should("deep.equal", { email: "pessoa@example.com", code: "123456" });
    cy.get("h1").should("have.text", "E-mail verificado").and("be.focused");
    cy.contains("a", "Ir para o login").should("have.attr", "href", "/login");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(pendingKey)).to.eq(null);
    });
    cy.location("pathname").should("eq", "/email-verification");
    cy.location("search").should("eq", "");
    cy.checkA11y(undefined, axeOptions);
  });

  it("uses pending registration context and lets the person change email", () => {
    cy.visit("/email-verification", {
      onBeforeLoad(win) {
        win.sessionStorage.setItem(
          pendingKey,
          JSON.stringify({ email: "pessoa@example.com", resendAvailableAt: 0 }),
        );
      },
    });
    cy.get("#verification-email").should("not.exist");
    cy.contains("p***@e***.com").should("be.visible");
    cy.get("#verification-code").type("123456");
    cy.contains("button", "Alterar e-mail").click();
    cy.get("#verification-email").should("have.value", "");
    cy.get("#verification-code").should("not.exist");
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem(pendingKey)).to.eq(null);
    });
    cy.reload();
    cy.get("#verification-email").should("be.visible");
    cy.location("search").should("eq", "");
  });
});
