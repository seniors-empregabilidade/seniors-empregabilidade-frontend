import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { queryClient } from "@/lib/query-client";
import { clearSession } from "@/lib/session-storage";

import { currentUserQueryKey } from "./current-user";
import type { UserType } from "./schema";

const sidebarSubtitle: Record<UserType, string> = {
  candidate: "Área do candidato",
  company: "Área da empresa",
  administrator: "Administração",
};

// Labels only, matching the confirmed screens for each role. None of these
// have a screen behind them yet, so the items are static text, not controls —
// turn them into real links once their pages ship.
const roleNavItems: Record<UserType, string[]> = {
  candidate: [
    "Relatórios",
    "Vagas",
    "Candidaturas",
    "Capacitação",
    "Como usar",
    "Meu perfil",
  ],
  company: ["Relatórios", "Minhas vagas", "Perfil"],
  administrator: ["Relatórios", "Empresas", "Candidatos", "Capacitação"],
};

interface SidebarProps {
  userType: UserType;
}

export function Sidebar({ userType }: SidebarProps) {
  const router = useRouter();

  function handleSignOut() {
    clearSession();
    queryClient.removeQueries({ queryKey: currentUserQueryKey });
    void router.navigate({ href: "/login" });
  }

  const navItems = roleNavItems[userType];

  return (
    <aside className="flex w-full flex-col justify-between bg-foreground px-5 py-6 sm:w-64 sm:shrink-0">
      <div>
        <p className="text-xl font-bold text-on-dark">Seniors</p>
        <p className="mt-1 text-base text-on-dark-subtle">
          {sidebarSubtitle[userType]}
        </p>

        <nav aria-label="Principal" className="mt-8">
          <ul className="flex flex-col gap-1">
            {navItems.map((label, index) => {
              const isActive = index === 0;

              return (
                <li key={label}>
                  {/* Static for now: none of these labels has a page behind it
                      yet, so they are not focusable controls and carry no
                      aria-current — wire them up as real links once their
                      routes ship. */}
                  <span
                    className={
                      isActive
                        ? "flex min-h-11 w-full items-center rounded-md bg-background px-3 text-base font-medium text-foreground"
                        : "flex min-h-11 w-full items-center rounded-md px-3 text-base font-medium text-on-dark-subtle"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-on-dark-muted/20 pt-4">
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-base font-medium text-on-dark-subtle transition-colors hover:bg-white/5 hover:text-on-dark focus-visible:ring-3 focus-visible:ring-on-dark focus-visible:outline-none"
          onClick={handleSignOut}
        >
          <LogOut aria-hidden="true" className="size-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
