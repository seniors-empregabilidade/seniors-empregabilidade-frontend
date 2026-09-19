import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro-empresa")({
  beforeLoad: () => {
    throw redirect({ to: "/users/register", search: { tipo: "empresa" } });
  },
});
