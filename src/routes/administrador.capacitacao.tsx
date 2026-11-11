import { createFileRoute } from "@tanstack/react-router";

import { TrainingsAdminPage } from "@/features/trainings/trainings-admin-page";

// requireRole("administrator") runs in the parent route (administrador.tsx).
export const Route = createFileRoute("/administrador/capacitacao")({
  component: () => <TrainingsAdminPage />,
});
