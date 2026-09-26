import { createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { RoleHomePage } from "@/features/auth/role-home-page";
import { RoleShell } from "@/features/auth/role-shell";

export const Route = createFileRoute("/administrador")({
  beforeLoad: () => requireRole("administrator"),
  component: () => (
    <RoleShell userType="administrator">
      <RoleHomePage title="Área do administrador" />
    </RoleShell>
  ),
});
