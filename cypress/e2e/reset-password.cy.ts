const VALID_PASSWORD = "Senha@Forte1";

describe("reset password screen", () => {
  it("shows the invalid/expired link state when there is no token", () => {
    cy.visit("/reset-password");

    cy.get("h1").should("have.text", "Link inválido ou expirado");
    cy.contains("a", "Solicitar novo link").should(
      "have.attr",
      "href",
      "/forgot-password",
    );
  });

  it("shows the invalid/expired link state for an expired token", () => {
    cy.visit("/reset-password?token=expired");

    cy.get("h1").should("have.text", "Link inválido ou expirado");
  });

  it("shows the form when a token is present", () => {
    cy.visit("/reset-password?token=valid-token");

    cy.get("h1").should("have.text", "Redefinir senha");
  });

  it("shows a reactive mismatch message instead of only disabling the button", () => {
    cy.visit("/reset-password?token=valid-token");

    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#confirm-password").type("outra-senha");

    cy.contains("As senhas não coincidem.").should("be.visible");
    cy.contains("button", "Redefinir senha").should("be.disabled");
  });

  it("toggles the new password and confirm password visibility independently", () => {
    cy.visit("/reset-password?token=valid-token");

    cy.get("#password").should("have.attr", "type", "password");
    cy.get("#confirm-password").should("have.attr", "type", "password");

    cy.contains("button", "Mostrar senha").first().click();
    cy.get("#password").should("have.attr", "type", "text");
    cy.get("#confirm-password").should("have.attr", "type", "password");

    cy.contains("button", "Mostrar senha").click();
    cy.get("#confirm-password").should("have.attr", "type", "text");
  });

  it("shows the success state after submitting matching valid passwords", () => {
    cy.visit("/reset-password?token=valid-token");

    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#confirm-password").type(VALID_PASSWORD);
    cy.contains("button", "Redefinir senha").click();

    cy.get("h1").should("have.text", "Senha redefinida!");
    cy.contains("a", "Ir para o login").should("have.attr", "href", "/login");
  });

  it("shows a generic error state when the submission fails", () => {
    cy.visit("/reset-password?token=server-error");

    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#confirm-password").type(VALID_PASSWORD);
    cy.contains("button", "Redefinir senha").click();

    cy.contains(
      "Não foi possível redefinir sua senha. Tente novamente em instantes.",
    ).should("be.visible");
    cy.get("h1").should("have.text", "Redefinir senha");
  });

  it("has no detectable WCAG 2.2 AA violations on the form", () => {
    cy.visit("/reset-password?token=valid-token");
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });

  it("has no detectable WCAG 2.2 AA violations on the invalid link state", () => {
    cy.visit("/reset-password");
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });

  it("has no detectable WCAG 2.2 AA violations on the success state", () => {
    cy.visit("/reset-password?token=valid-token");
    cy.get("#password").type(VALID_PASSWORD);
    cy.get("#confirm-password").type(VALID_PASSWORD);
    cy.contains("button", "Redefinir senha").click();

    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });
});
