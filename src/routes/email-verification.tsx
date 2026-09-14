import { createFileRoute } from "@tanstack/react-router";

import { EmailVerificationPage } from "@/features/accounts/email-verification-page";

export const Route = createFileRoute("/email-verification")({
  component: EmailVerificationPage,
});
