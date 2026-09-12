describe("login screen", () => {
  it("loads the login page", () => {
    cy.visit("/login");

    cy.get("h1").should("have.text", "Entrar");
    cy.contains("a", "Esqueci minha senha").should(
      "have.attr",
      "href",
      "/forgot-password",
    );
  });

  it("navigates to forgot-password through the real browser URL", () => {
    cy.visit("/login");

    cy.contains("a", "Esqueci minha senha").click();
    cy.location("pathname").should("eq", "/forgot-password");
  });

  it("navigates to professional registration through the real browser URL", () => {
    cy.visit("/login");

    cy.contains("button", "Criar conta").click();
    cy.location("pathname").should("eq", "/users/register");
  });

  it("keeps Entrar disabled while loading and lands on the candidate home", () => {
    cy.visit("/login");

    cy.get("#email").type("usuario@exemplo.com");
    cy.get("#password").type("senha-segura");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Entrando...")
      .should("be.disabled")
      .and("have.attr", "aria-busy", "true");
    cy.contains("button", "Entrando...").click({ force: true });

    cy.location("pathname").should("eq", "/candidato");
    cy.contains("h1", "Área do candidato").should("be.visible");
  });

  it("redirects an administrator mock login to /administrador", () => {
    cy.visit("/login");

    cy.get("#email").type("admin@exemplo.com");
    cy.get("#password").type("senha-segura");
    cy.contains("button", "Entrar").click();

    cy.location("pathname").should("eq", "/administrador");
    cy.contains("h1", "Área do administrador").should("be.visible");
  });
});
