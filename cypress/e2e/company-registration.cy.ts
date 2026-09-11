describe("company registration", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/company-registry-records/*", {
      cnpj: "11222333000181",
      legal_name: "Synthetic Registry SA",
      trade_name: null,
      primary_cnae: "6201501",
    }).as("registry");
    cy.intercept("GET", "https://viacep.com.br/ws/*/json/", {
      cep: "12345-678",
      logradouro: "Synthetic Street",
      bairro: "Synthetic District",
      localidade: "Synthetic City",
      uf: "RS",
    }).as("postal");
    cy.visit("/users/register");
    cy.contains("button", "Empresa").click();
  });

  function completeForm() {
    cy.get('[id="display_name"]').type("Synthetic Company");
    cy.get('[id="cnpj"]').type("11222333000181");
    cy.get('[id="address.zip_code"]').type("12345678");
    cy.wait(["@registry", "@postal"]);
    cy.get('[id="address.city"]').should("have.value", "Synthetic City");
    cy.get('[id="address.number"]').type("42");
    cy.get('[id="corporate_email"]').type("contact@synthetic.invalid");
    cy.get('[id="password"]').type("SyntheticPass!2026");
    cy.get('[id="confirm_password"]').type("SyntheticPass!2026");
    cy.get('input[type="checkbox"]').check();
  }

  it("submits the API contract and confirms email while remaining pending", () => {
    cy.intercept("POST", "**/api/v1/companies", {
      statusCode: 201,
      body: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "contact@synthetic.invalid",
        status: "pending",
        email_confirmation_required: true,
      },
    }).as("register");
    cy.intercept("POST", "**/email-verification/confirm", {
      statusCode: 204,
    }).as("confirm");
    completeForm();
    cy.contains("button", "Criar conta").click();
    cy.wait("@register")
      .its("request.body")
      .should("include", {
        cnpj: "11222333000181",
        corporate_email: "contact@synthetic.invalid",
        terms_accepted: true,
      })
      .and("not.have.property", "confirm_password");
    cy.get("h1").should("have.text", "Cadastro recebido").and("have.focus");
    cy.contains("Sua empresa está pendente de aprovação").should("be.visible");
    cy.get("#confirmation-code").type("123456");
    cy.contains("button", "Confirmar e-mail").click();
    cy.wait("@confirm");
    cy.contains("E-mail confirmado").should("be.visible");
  });

  it("keeps input and associates duplicate CNPJ with its field", () => {
    cy.intercept("POST", "**/api/v1/companies", {
      statusCode: 409,
      headers: { "content-type": "application/problem+json" },
      body: {
        title: "Conflict",
        status: 409,
        code: "company_cnpj_conflict",
        detail: "Synthetic conflict",
        errors: { cnpj: ["Synthetic conflict"] },
      },
    }).as("register");
    completeForm();
    cy.contains("button", "Criar conta").click();
    cy.wait("@register");
    cy.get("#cnpj")
      .should("have.attr", "aria-invalid", "true")
      .and("have.focus");
    cy.get('[id="display_name"]').should("have.value", "Synthetic Company");
  });

  it("has no detectable WCAG 2.2 AA issues and fits a narrow viewport", () => {
    cy.viewport(390, 844);
    cy.injectAxe();
    cy.checkA11y(undefined, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(390);
    });
    cy.get("#password").focus();
    cy.focused().should("have.attr", "id", "password");
    cy.contains("button", "Mostrar senha").click();
    cy.get("#password").should("have.attr", "type", "text");
  });
});
