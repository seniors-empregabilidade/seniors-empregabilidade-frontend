import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type AccountType = "candidate" | "company";

export function RegistrationPage({
  candidate,
  company,
  accountType,
  onAccountTypeChange,
}: {
  candidate: ReactNode;
  company: ReactNode;
  accountType: AccountType;
  onAccountTypeChange: (next: AccountType) => void;
}) {
  const showingCandidate = accountType === "candidate";
  return (
    <>
      <nav
        aria-label="Tipo de cadastro"
        className="mx-auto max-w-2xl px-6 pt-8"
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-accent p-1">
          <Button
            type="button"
            size="lg"
            variant={showingCandidate ? "default" : "ghost"}
            className="w-full rounded-lg"
            aria-pressed={showingCandidate}
            onClick={() => onAccountTypeChange("candidate")}
          >
            Sou um candidato
          </Button>
          <Button
            type="button"
            size="lg"
            variant={showingCandidate ? "ghost" : "default"}
            className="w-full rounded-lg"
            aria-pressed={!showingCandidate}
            onClick={() => onAccountTypeChange("company")}
          >
            Sou uma empresa
          </Button>
        </div>
      </nav>
      <div hidden={!showingCandidate}>{candidate}</div>
      <main hidden={showingCandidate} className="mx-auto max-w-2xl px-6 py-8">
        {company}
      </main>
    </>
  );
}
