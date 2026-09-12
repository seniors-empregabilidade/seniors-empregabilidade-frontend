import { createFileRoute } from "@tanstack/react-router";

import { RoleHomePage } from "@/features/auth/role-home-page";

export const Route = createFileRoute("/candidato")({
  component: () => <RoleHomePage title="Área do candidato" />,
});
