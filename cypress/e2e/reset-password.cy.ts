const EMAIL = "candidato@exemplo.invalid";
const VALID_PASSWORD = "Senha@Forte1";
const SCREEN = `/reset-password?email=${encodeURIComponent(EMAIL)}`;
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

function stubConfirm(statusCode: number, body: unknown = "") {
  cy.intercept("POST", "**/password-reset/confirm", {
    statusCode,
    body,
    headers: { "content-type": "application/problem+json" },
  }).as("confirm");
}

function fillForm() {
  cy.get("#code").type("123456");
  cy.get("#password").type(VALID_PASSWORD);
  cy.get("#confirm-password").type(VALID_PASSWORD);
}

describe("reset password screen", () => {
  it("prefills the address carried from the request screen", () => {
    cy.visit(SCREEN);

    cy.get("h1").should("have.text", "Redefinir senha");
    cy.get("#email").should("have.value", EMAIL);
  });

  it("still works when opened without an address", () => {
    cy.visit("/reset-password");

    cy.get("h1").should("have.text", "Redefinir senha");
    cy.get("#email").should("have.value", "");
  });

  it("sends the address, the code and the new password", () => {
    stubConfirm(204);
    cy.visit(SCREEN);

    fillForm();
    cy.contains("button", "Redefinir senha").click();

    cy.wait("@confirm").its("request.body").should("deep.equal", {
      email: EMAIL,
      code: "123456",
      password: VALID_PASSWORD,
    });
    cy.get("h1").should("have.text", "Senha redefinida!");
    cy.contains("a", "Ir para o login").should("have.attr", "href", "/login");
  });

  it("shows a reactive mismatch message", () => {
    cy.visit(SCREEN);

    cy.get("#code").type("123456");
    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#confirm-password").type("outra-senha");
    cy.contains("button", "Redefinir senha").click();

    cy.contains("As senhas não coincidem.").should("be.visible");
  });

  it("toggles the new password and confirm password visibility independently", () => {
    cy.visit(SCREEN);

    cy.get("#password").should("have.attr", "type", "password");
    cy.get("#confirm-password").should("have.attr", "type", "password");

    cy.contains("button", "Mostrar senha").first().click();
    cy.get("#password").should("have.attr", "type", "text");
    cy.get("#confirm-password").should("have.attr", "type", "password");

    cy.contains("button", "Mostrar senha").click();
    cy.get("#confirm-password").should("have.attr", "type", "text");
  });

  it("shows the expired-code state when the API rejects the code", () => {
    stubConfirm(422, {
      title: "Validation Error",
      status: 422,
      detail: "The verification code is invalid or expired.",
      code: "invalid_verification_code",
      errors: { code: ["The verification code is invalid or expired."] },
    });
    cy.visit(SCREEN);

    fillForm();
    cy.contains("button", "Redefinir senha").click();

    cy.get("h1").should("have.text", "Código inválido ou expirado");
    cy.contains("a", "Solicitar novo código").should(
      "have.attr",
      "href",
      "/forgot-password",
    );
  });

  it("reports a password the pool refuses without leaking the API text", () => {
    stubConfirm(422, {
      title: "Validation Error",
      status: 422,
      detail: "The password does not meet the identity provider policy.",
      code: "password_policy_violation",
      errors: { password: ["The password does not meet the required policy."] },
    });
    cy.visit(SCREEN);

    fillForm();
    cy.contains("button", "Redefinir senha").click();

    cy.contains("A senha não atende aos requisitos de segurança.").should(
      "be.visible",
    );
    cy.contains("identity provider policy").should("not.exist");
    cy.get("h1").should("have.text", "Redefinir senha");
  });

  it("shows a generic error when the provider is unavailable", () => {
    stubConfirm(503, {
      title: "Service Unavailable",
      status: 503,
      detail: "The identity provider is temporarily unavailable.",
      code: "identity_provider_unavailable",
    });
    cy.visit(SCREEN);

    fillForm();
    cy.contains("button", "Redefinir senha").click();

    cy.contains("Serviço temporariamente indisponível").should("be.visible");
    cy.get("h1").should("have.text", "Redefinir senha");
  });

  it("has no detectable WCAG 2.2 AA violations on the form", () => {
    cy.visit(SCREEN);
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });

  it("has no detectable WCAG 2.2 AA violations on the expired-code state", () => {
    stubConfirm(422, {
      title: "Validation Error",
      status: 422,
      detail: "The verification code is invalid or expired.",
      code: "invalid_verification_code",
    });
    cy.visit(SCREEN);
    fillForm();
    cy.contains("button", "Redefinir senha").click();
    cy.get("h1").should("have.text", "Código inválido ou expirado");

    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });

  it("has no detectable WCAG 2.2 AA violations on the success state", () => {
    stubConfirm(204);
    cy.visit(SCREEN);
    fillForm();
    cy.contains("button", "Redefinir senha").click();
    cy.get("h1").should("have.text", "Senha redefinida!");

    cy.injectAxe();
    cy.checkA11y(undefined, WCAG);
  });
});
