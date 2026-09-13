import { getRouteApi } from "@tanstack/react-router";

import { RegistrationPage } from "@/components/registration/registration-page";
import { CompanyRegistrationForm } from "@/features/companies/company-registration-form";
import { ProfessionalRegister } from "@/features/professional-register";

import { registerSearchSchema } from "./-register-search";

const route = getRouteApi("/users/register");

export function RegisterAccount() {
  const { tipo } = registerSearchSchema.parse(route.useSearch());
  return (
    <RegistrationPage
      initialAccountType={tipo === "empresa" ? "company" : "candidate"}
      candidate={<ProfessionalRegister />}
      company={<CompanyRegistrationForm />}
    />
  );
}
