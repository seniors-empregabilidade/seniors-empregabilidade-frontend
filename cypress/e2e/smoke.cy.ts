describe("landing page", () => {
  it("loads the landing page and presents the value proposition", () => {
    cy.visit("/");

    cy.get("h1").should("contain.text", "Vinte anos de carreira");
    cy.contains("a", "Criar minha conta")
      .should("be.visible")
      .and("have.attr", "href", "/cadastro");
    cy.contains("a", "Cadastrar minha empresa")
      .should("be.visible")
      .and("have.attr", "href", "/cadastro-empresa");
    cy.contains("a", "Entrar")
      .should("be.visible")
      .and("have.attr", "href", "/login");
  });

  it("sends candidates and companies to the registration page on their own tab, and returning visitors to the login page", () => {
    cy.visit("/");

    cy.contains("a", "Criar minha conta").click();
    cy.location("pathname").should("eq", "/users/register");
    cy.contains("button", "Candidato").should(
      "have.attr",
      "aria-pressed",
      "true",
    );

    cy.visit("/");
    cy.contains("a", "Cadastrar minha empresa").click();
    cy.location("pathname").should("eq", "/users/register");
    cy.contains("button", "Empresa").should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    cy.contains("legend", "Organização").should("be.visible");

    cy.visit("/");
    cy.contains("a", "Entrar").click();
    cy.location("pathname").should("eq", "/login");
    cy.get("h1").should("contain.text", "Entrar");
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
