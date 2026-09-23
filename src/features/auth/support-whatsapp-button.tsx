import { MessageCircle } from "lucide-react";

// Static for now: there is no WhatsApp link to open yet, so this is not a
// focusable control — turn it into a real link once the number is confirmed.
export function SupportWhatsAppButton() {
  return (
    <span className="fixed right-6 bottom-6 z-40 flex min-h-11 items-center gap-2 rounded-full bg-success px-5 py-3 text-base font-medium text-white shadow-lg">
      <MessageCircle aria-hidden="true" className="size-5" />
      Suporte no WhatsApp
    </span>
  );
}
