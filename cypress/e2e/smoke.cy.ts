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

  it("navigates candidates, companies, and returning visitors to their placeholder pages and back", () => {
    cy.visit("/");

    cy.contains("a", "Criar minha conta").click();
    cy.location("pathname").should("eq", "/cadastro");
    cy.get("h1").should("contain.text", "Essa etapa ainda está em construção");
    cy.contains("p", "Cadastro de profissional").should("be.visible");
    cy.contains("a", "Voltar para a página inicial").click();
    cy.location("pathname").should("eq", "/");
    cy.get("h1").should("contain.text", "Vinte anos de carreira");

    cy.contains("a", "Cadastrar minha empresa").click();
    cy.location("pathname").should("eq", "/cadastro-empresa");
    cy.contains("p", "Cadastro de empresa").should("be.visible");
    cy.contains("a", "Voltar para a página inicial").click();
    cy.location("pathname").should("eq", "/");

    cy.contains("a", "Entrar").click();
    cy.location("pathname").should("eq", "/login");
    cy.contains("p", "Entrar").should("be.visible");
    cy.contains("a", "Voltar para a página inicial").click();
    cy.location("pathname").should("eq", "/");
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
