import { createFileRoute } from "@tanstack/react-router";
import ApplicationsPage from "@/features/candidates/applications"; // Ajuste o caminho da sua página

export const Route = createFileRoute("/users/applications")({
  component: ApplicationsPage,
});
