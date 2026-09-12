import { createFileRoute } from "@tanstack/react-router";

import { RoleHomePage } from "@/features/auth/role-home-page";
import { requireRole } from "@/features/auth/require-role";

export const Route = createFileRoute("/candidato")({
  beforeLoad: () => requireRole("candidate"),
  component: () => <RoleHomePage title="Área do candidato" />,
});
