import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { RoleShell } from "@/features/auth/role-shell";

export const Route = createFileRoute("/empresa")({
  beforeLoad: () => requireRole("company"),
  component: () => (
    <RoleShell userType="company">
      <Outlet />
    </RoleShell>
  ),
});
