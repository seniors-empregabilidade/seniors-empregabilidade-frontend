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

  it("keeps Entrar disabled while the API answers, then lands on the candidate home", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 200,
      delay: 300,
      body: {
        access_token: "e2e-access-token",
        id_token: "e2e-id-token",
        refresh_token: null,
        expires_in: 900,
        token_type: "Bearer",
        user_id: "11111111-1111-4111-8111-111111111111",
        user_type: "candidate",
      },
    }).as("login");
    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: {
        id: "11111111-1111-4111-8111-111111111111",
        user_type: "candidate",
        company_status: null,
      },
    });

    cy.visit("/login");

    cy.get("#email").type("usuario@exemplo.com");
    cy.get("#password").type("senha-segura");
    cy.contains("button", "Entrar").click();

    cy.contains("button", "Entrando...")
      .should("be.disabled")
      .and("have.attr", "aria-busy", "true");
    cy.contains("button", "Entrando...").click({ force: true });

    cy.wait("@login");
    cy.get("@login.all").should("have.length", 1);
    cy.location("pathname").should("eq", "/candidato");
    cy.contains("h1", "Área do candidato").should("be.visible");
  });

  it("shows a generic message when the API refuses the credentials", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "The email or password is incorrect.",
        code: "invalid_credentials",
      },
    }).as("login");

    cy.visit("/login");

    cy.get("#email").type("usuario@exemplo.com");
    cy.get("#password").type("senha-errada");
    cy.contains("button", "Entrar").click();

    cy.wait("@login");
    cy.get("[role=alert]").should("contain.text", "E-mail ou senha incorretos");
    cy.location("pathname").should("eq", "/login");
  });
});
