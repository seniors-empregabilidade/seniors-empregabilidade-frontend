import { createFileRoute } from "@tanstack/react-router";

import { CourseSearchView } from "@/features/trainings/course-search-view";

export const Route = createFileRoute("/candidato/capacitacao")({
  component: () => <CourseSearchView />,
});
