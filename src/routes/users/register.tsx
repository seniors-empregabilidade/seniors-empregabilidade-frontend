import { createFileRoute } from "@tanstack/react-router";

import { RegistrationPage } from "@/components/registration/registration-page";
import { CompanyRegistrationForm } from "@/features/companies/company-registration-form";
import { ProfessionalRegister } from "@/features/professional-register";

export const Route = createFileRoute("/users/register")({
  component: () => (
    <RegistrationPage
      candidate={<ProfessionalRegister />}
      company={<CompanyRegistrationForm />}
    />
  ),
});
