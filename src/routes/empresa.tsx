import { createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { RoleHomePage } from "@/features/auth/role-home-page";
import { RoleShell } from "@/features/auth/role-shell";

export const Route = createFileRoute("/empresa")({
  beforeLoad: () => requireRole("company"),
  component: () => (
    <RoleShell userType="company">
      <RoleHomePage title="Área da empresa" />
    </RoleShell>
  ),
});
