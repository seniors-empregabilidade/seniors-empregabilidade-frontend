import { createFileRoute } from "@tanstack/react-router";

import { CompanyJobsPage } from "@/features/companies/company-jobs-page";

// O beforeLoad com requireRole("company") está no empresa.tsx (rota pai) e
// cobre esta rota filha. onEditJob fica de fora até a US-18-T03 existir —
// a tela desabilita o botão "Editar" sozinha quando não recebe a prop.
export const Route = createFileRoute("/empresa/vagas")({
  component: () => <CompanyJobsPage />,
});
