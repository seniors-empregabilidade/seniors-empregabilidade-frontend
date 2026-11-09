import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import {
  supportContactQueryOptions,
  supportWhatsAppUrl,
} from "./support-contact";

export function SupportWhatsAppButton() {
  const contact = useQuery(supportContactQueryOptions);

  if (!contact.data) {
    return null;
  }

  return (
    <a
      href={supportWhatsAppUrl(contact.data)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-6 z-40 flex min-h-11 items-center gap-2 rounded-full bg-success px-5 py-3 text-base font-medium text-primary-foreground shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      Suporte no WhatsApp
      {/* The visible label stays in the accessible name (WCAG 2.5.3). */}
      <span className="sr-only"> abre em uma nova aba</span>
    </a>
  );
}
