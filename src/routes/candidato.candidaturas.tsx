import { createFileRoute } from "@tanstack/react-router";

import ApplicationsPage from "@/features/candidates/applications";

export const Route = createFileRoute("/candidato/candidaturas")({
  component: ApplicationsPage,
});
