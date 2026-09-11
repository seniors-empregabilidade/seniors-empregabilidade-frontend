import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/cadastro-empresa")({
  component: () => (
    <PlaceholderPage
      eyebrow="Cadastro de empresa"
      description="Em breve sua empresa vai poder se cadastrar por aqui e publicar vagas."
    />
  ),
});
