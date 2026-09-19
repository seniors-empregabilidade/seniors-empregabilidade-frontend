import { createFileRoute } from "@tanstack/react-router";

import { requireRole } from "@/features/auth/require-role";
import { ProfileView } from "@/features/candidates/profile-view";

export const Route = createFileRoute("/candidato/perfil")({
  beforeLoad: () => requireRole("candidate"),
  component: () => (
    <ProfileView
      onEditProfile={() => {
        //modal de edição de perfil (US-09-T03)
      }}
    />
  ),
});
