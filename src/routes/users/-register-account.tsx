import { getRouteApi, useNavigate } from "@tanstack/react-router";

import {
  RegistrationPage,
  type AccountType,
} from "@/components/registration/registration-page";
import { ProfessionalRegister } from "@/features/candidates/professional-register";
import { CompanyRegistrationForm } from "@/features/companies/company-registration-form";

import { registerSearchSchema } from "./-register-search";

const route = getRouteApi("/users/register");

export function RegisterAccount() {
  const { tipo } = registerSearchSchema.parse(route.useSearch());
  const navigate = useNavigate();
  return (
    <RegistrationPage
      accountType={tipo === "empresa" ? "company" : "candidate"}
      onAccountTypeChange={(next: AccountType) => {
        void navigate({
          to: "/users/register",
          search: { tipo: next === "company" ? "empresa" : "candidato" },
          replace: true,
        });
      }}
      candidate={
        <ProfessionalRegister
          onEmailVerificationRequired={() =>
            navigate({ to: "/email-verification" })
          }
        />
      }
      company={<CompanyRegistrationForm />}
    />
  );
}
