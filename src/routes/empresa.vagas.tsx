import { createFileRoute } from "@tanstack/react-router";

import { MyJobsPage } from "@/features/jobs/my-jobs-page";

// requireRole("company") runs in the parent route (empresa.tsx). The page
// itself handles a company that is not approved yet, which the API refuses.
export const Route = createFileRoute("/empresa/vagas")({
  component: () => <MyJobsPage />,
});
