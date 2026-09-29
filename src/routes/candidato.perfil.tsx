import { createFileRoute } from "@tanstack/react-router";

import { ProfileView } from "@/features/candidates/profile-view";

// O beforeLoad com requireRole("candidate") já está no candidato.tsx (rota
// pai) e cobre esta rota filha automaticamente — repeti-lo aqui seria
// redundante.
export const Route = createFileRoute("/candidato/perfil")({
  component: () => <ProfileView />,
});
