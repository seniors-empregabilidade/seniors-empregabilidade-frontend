import { createFileRoute } from "@tanstack/react-router";

import { defaultAccountFilters } from "@/features/account-management/accounts-api";
import { AccountsPage } from "@/features/account-management/accounts-page";

// requireRole("administrator") runs in the parent route (administrador.tsx).
export const Route = createFileRoute("/administrador/empresas")({
  component: () => (
    <AccountsPage
      title="Empresas"
      description="Aprove ou recuse as empresas que aguardam análise. Os filtros mostram as demais situações."
      initialFilters={{
        ...defaultAccountFilters,
        userType: "company",
        companyStatus: "pending",
      }}
    />
  ),
});
