import { createFileRoute } from "@tanstack/react-router";

import { RoleHomePage } from "@/features/auth/role-home-page";
import { requireRole } from "@/features/auth/require-role";

export const Route = createFileRoute("/empresa")({
  beforeLoad: () => requireRole("company"),
  component: () => <RoleHomePage title="Área da empresa" />,
});
