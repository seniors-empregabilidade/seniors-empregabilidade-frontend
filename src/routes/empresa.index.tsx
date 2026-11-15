import { createFileRoute, redirect } from "@tanstack/react-router";

// A home da empresa é a tela de Candidatos: quem abrir /empresa (digitando a
// URL, por exemplo) cai direto nela.
export const Route = createFileRoute("/empresa/")({
  beforeLoad: () => {
    throw redirect({ to: "/empresa/candidatos", search: {}, replace: true });
  },
});
