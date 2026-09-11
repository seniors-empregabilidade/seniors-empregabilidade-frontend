import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/login")({
  component: () => (
    <PlaceholderPage
      eyebrow="Entrar"
      description="Em breve você vai poder entrar na sua conta por aqui."
    />
  ),
});
