import { createFileRoute } from "@tanstack/react-router";

import { RequestPasswordResetPage } from "@/features/password-reset/request-password-reset-page";

export const Route = createFileRoute("/forgot-password")({
  component: RequestPasswordResetPage,
});
