/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ResetPasswordPage } from "@/features/password-reset/reset-password-page";

const resetPasswordSearchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  // `Route.useSearch()` resolves to `any` because `router.tsx` registers the
  // route tree as `AnyRoute`, so the search value is re-validated here to get
  // a concretely typed result instead of asserting past that gap.
  const { email } = resetPasswordSearchSchema.parse(Route.useSearch());

  return <ResetPasswordPage email={email ?? ""} />;
}
