import { createFileRoute } from "@tanstack/react-router";

import { RoleHomePage } from "@/features/auth/role-home-page";

export const Route = createFileRoute("/empresa")({
  component: () => <RoleHomePage title="Área da empresa" />,
});
