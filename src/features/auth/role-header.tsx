import { Bell } from "lucide-react";

export function RoleHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-8 py-5">
      <p className="text-xl font-semibold text-foreground">Olá!</p>

      {/* Static for now: there is no notifications feed to open yet, so this
          is not a focusable control — turn it into a real button once it has
          somewhere to send the visitor. */}
      <span className="flex min-h-11 items-center gap-2 rounded-full border border-input px-4 py-2 text-base font-medium text-foreground">
        <Bell aria-hidden="true" className="size-4" />
        Notificações
      </span>
    </header>
  );
}
