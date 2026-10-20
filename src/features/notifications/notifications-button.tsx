import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { fetchUnreadCount, notificationsQueryKey } from "./notifications-api";

export type NotificationsPath =
  "/candidato/notificacoes" | "/empresa/notificacoes";

interface NotificationsButtonProps {
  to: NotificationsPath;
}

export function NotificationsButton({ to }: NotificationsButtonProps) {
  const { data: unreadCount } = useQuery({
    queryKey: [...notificationsQueryKey, "unread-count"],
    queryFn: ({ signal }) => fetchUnreadCount(signal),
    retry: false,
  });

  // The counter is a convenience: while it loads or if it fails, the link
  // still opens the notification center.
  const hasUnread = unreadCount !== undefined && unreadCount > 0;
  const accessibleName = hasUnread
    ? `Notificações, ${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
    : "Notificações";

  return (
    <Link
      to={to}
      aria-label={accessibleName}
      className="flex min-h-11 items-center gap-2 rounded-full border border-input px-4 py-2 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Bell aria-hidden="true" className="size-4" />
      Notificações
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="inline-flex min-w-7 items-center justify-center rounded-full bg-primary px-2 text-base font-semibold text-primary-foreground"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
