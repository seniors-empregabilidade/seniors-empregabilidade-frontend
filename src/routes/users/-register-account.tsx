import { getRouteApi, useNavigate } from "@tanstack/react-router";

import {
  RegistrationPage,
  type AccountType,
} from "@/components/registration/registration-page";
import { CompanyRegistrationForm } from "@/features/companies/company-registration-form";
import { ProfessionalRegister } from "@/features/professional-register";

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
      candidate={<ProfessionalRegister />}
      company={<CompanyRegistrationForm />}
    />
  );
}
