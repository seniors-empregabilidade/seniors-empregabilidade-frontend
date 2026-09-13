describe("forgot password screen", () => {
  it("goes back to the login screen", () => {
    cy.visit("/forgot-password");

    cy.contains("a", "Voltar para o login").click();
    cy.location("pathname").should("eq", "/login");
  });

  it("validates an empty and then an invalid e-mail before submitting", () => {
    cy.visit("/forgot-password");

    cy.contains("button", "Enviar").click();
    cy.contains("Informe seu e-mail.").should("be.visible");

    cy.get("#email").type("invalido");
    cy.contains("button", "Enviar").click();
    cy.contains("Informe um e-mail válido.").should("be.visible");
  });

  it("traps focus inside the success dialog and restores it to the submit button on close", () => {
    cy.visit("/forgot-password");

    cy.get("#email").type("usuario@exemplo.com");
    cy.contains("button", "Enviar").as("submitButton").click();

    cy.get('[role="dialog"]').should("be.visible");
    cy.contains("button", "Entendi").should("be.focused");

    cy.realPress("Tab");
    cy.contains("button", "Entendi").should("be.focused");

    cy.realPress("Tab");
    cy.contains("button", "Entendi").should("be.focused");

    cy.contains("button", "Entendi").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.get("@submitButton").should("be.focused");
  });

  it("has no detectable WCAG 2.2 AA violations", () => {
    cy.visit("/forgot-password");
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });

  it("has no detectable WCAG 2.2 AA violations with the success dialog open", () => {
    cy.visit("/forgot-password");

    cy.get("#email").type("usuario@exemplo.com");
    cy.contains("button", "Enviar").click();
    cy.get('[role="dialog"]').should("be.visible");

    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });
});
