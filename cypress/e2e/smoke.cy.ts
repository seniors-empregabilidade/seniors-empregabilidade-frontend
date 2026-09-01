describe("landing page", () => {
  it("loads the landing page and presents the value proposition", () => {
    cy.visit("/");

    cy.get("h1").should("contain.text", "Vinte anos de carreira");
    cy.contains("button", "Criar minha conta").should("be.visible");
    cy.contains("button", "Cadastrar minha empresa").should("be.visible");
  });

  it("has no detectable WCAG 2.2 AA violations on the landing page", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });

  it("shows the not-found page for an unknown route", () => {
    cy.visit("/route-that-does-not-exist", { failOnStatusCode: false });

    cy.get("h1").should("have.text", "Página não encontrada.");
  });
});
