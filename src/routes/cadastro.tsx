import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/placeholder-page";

export const Route = createFileRoute("/cadastro")({
  component: () => (
    <PlaceholderPage
      eyebrow="Cadastro de profissional"
      description="Em breve você vai poder criar sua conta por aqui e montar seu currículo."
    />
  ),
});
