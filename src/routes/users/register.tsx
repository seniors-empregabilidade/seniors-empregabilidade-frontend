import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalRegister } from "@/features/professional-register";

export const Route = createFileRoute("/users/register")({
  component: ProfessionalRegister,
});
