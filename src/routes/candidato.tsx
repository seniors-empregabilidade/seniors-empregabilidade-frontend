import { createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { RoleHomePage } from "@/features/auth/role-home-page";
import { RoleShell } from "@/features/auth/role-shell";

export const Route = createFileRoute("/candidato")({
  beforeLoad: () => requireRole("candidate"),
  component: () => (
    <RoleShell userType="candidate">
      <RoleHomePage title="Área do candidato" />
    </RoleShell>
  ),
});
