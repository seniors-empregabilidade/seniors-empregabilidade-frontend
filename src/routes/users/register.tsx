import { createFileRoute } from "@tanstack/react-router";

import { RegistrationPage } from "@/components/registration/registration-page";
import { CompanyRegistrationForm } from "@/features/companies/company-registration-form";

import { UserRegister } from "./-user-register";

export const Route = createFileRoute("/users/register")({
  component: () => (
    <RegistrationPage
      candidate={<UserRegister />}
      company={<CompanyRegistrationForm />}
    />
  ),
});
