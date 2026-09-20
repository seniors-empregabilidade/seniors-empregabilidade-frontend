import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";

export const Route = createFileRoute("/candidato")({
  beforeLoad: () => requireRole("candidate"),
  component: () => <Outlet />,
});
