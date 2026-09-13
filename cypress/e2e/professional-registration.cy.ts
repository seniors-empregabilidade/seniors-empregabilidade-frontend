describe("professional registration", () => {
  it("submits the exact contract and continues to email verification", () => {
    cy.intercept("GET", "https://viacep.com.br/ws/01001000/json/", {
      statusCode: 200,
      body: {
        logradouro: "Rua de Teste",
        bairro: "Bairro de Teste",
        localidade: "Cidade de Teste",
        uf: "SP",
      },
    }).as("postalCode");

    cy.intercept("POST", "**/api/v1/professionals", {
      statusCode: 201,
      body: {
        id: "00000000-0000-4000-8000-000000000001",
        full_name: "Pessoa de Teste",
        email: "pessoa@example.com",
        email_verification_required: true,
      },
    }).as("registration");
    cy.intercept("POST", "**/api/v1/email-verification/send").as(
      "verificationSend",
    );

    cy.visit("/users/register");
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });

    cy.get("#name").type("Pessoa de Teste");
    cy.get("#cpf").type("12345678909");
    cy.get("#birthDate").type("1970-01-01");
    cy.get("#phone").type("11999990000");
    cy.get("#email").type("pessoa@example.com");
    cy.get("#cep").type("01001000");
    cy.wait("@postalCode");
    cy.get("#city").should("have.value", "Cidade de Teste");
    cy.get("#state").should("have.value", "SP");
    cy.get("#password").type("Synthetic123");
    cy.get("#confirmPassword").type("Synthetic123");
    cy.get("#acceptedTerms").check();
    cy.contains("button", "Criar conta").click();

    cy.get("#password-error").should(
      "have.text",
      "Inclua pelo menos um símbolo na senha, como !, @ ou #.",
    );
    cy.get("#password")
      .should("be.focused")
      .and("have.attr", "aria-describedby", "password-hint password-error");
    cy.get("#password-hint").should(
      "contain.text",
      "uma letra maiúscula, uma minúscula, um número e um símbolo",
    );
    cy.get("@registration.all").should("have.length", 0);
    cy.get("#password").clear().type("Synthetic123!");
    cy.get("#confirmPassword").clear().type("Synthetic123!");
    cy.contains("button", "Criar conta").click();

    cy.wait("@registration").its("request.body").should("deep.equal", {
      full_name: "Pessoa de Teste",
      cpf: "12345678909",
      birth_date: "1970-01-01",
      phone: "11999990000",
      email: "pessoa@example.com",
      password: "Synthetic123!",
      terms_version_accepted: "v1",
      city: "Cidade de Teste",
      state: "SP",
    });
    cy.location("pathname").should("eq", "/email-verification");
    cy.location("search").should("eq", "");
    cy.get("h1")
      .should("have.text", "Informe o código de verificação")
      .and("be.focused");
    cy.contains("p***@e***.com").should("be.visible");
    cy.get("body").should("not.contain.text", "pessoa@example.com");
    cy.get("#verification-email").should("not.exist");
    cy.get("#verification-code").should("be.visible");
    cy.contains("button", "Reenviar código").should("be.disabled");
    cy.get("@verificationSend.all").should("have.length", 0);
    cy.get("#resend-countdown").should(
      "contain.text",
      "Você pode solicitar outro código em",
    );
    cy.window().then((win) => {
      const pending = JSON.parse(
        win.sessionStorage.getItem("seniors.pending-verification-email") ??
          "null",
      ) as unknown;
      expect(pending).to.have.property("email", "pessoa@example.com");
      expect(pending).to.have.property("resendAvailableAt");
    });
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
  });
});
