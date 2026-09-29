import { createFileRoute } from "@tanstack/react-router";

import { JobSearchView } from "@/features/candidates/job-search-view";

export const Route = createFileRoute("/candidato/vagas")({
  component: () => <JobSearchView />,
});
