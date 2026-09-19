import { createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { ProfileView } from "@/features/candidates/profile-view";

export const Route = createFileRoute("/candidato/perfil")({
  beforeLoad: () => requireRole("candidate"),
  // onEditProfile fica de fora até a US-09-T03 existir de verdade —
  // o ProfileView desabilita o botão sozinho quando não recebe a prop.
  component: () => <ProfileView />,
});
