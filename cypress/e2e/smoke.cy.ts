describe("technical frontend", () => {
  it("loads the home page and exposes the technical details", () => {
    cy.visit("/");

    cy.get("h1").should("have.text", "Seniors – Empregabilidade");

    cy.contains("button", "Ver detalhes técnicos").click();
    cy.get('section[aria-label="Detalhes técnicos"]').should("be.visible");
  });

  it("has no detectable WCAG 2.2 AA violations on the home page", () => {
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
