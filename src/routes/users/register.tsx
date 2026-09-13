import { createFileRoute } from "@tanstack/react-router";

import { RegisterAccount } from "./-register-account";
import { registerSearchSchema } from "./-register-search";

export const Route = createFileRoute("/users/register")({
  validateSearch: registerSearchSchema,
  component: RegisterAccount,
});
