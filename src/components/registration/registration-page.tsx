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
        className="mx-auto flex max-w-2xl gap-4 px-6 pt-8"
      >
        <Button
          type="button"
          variant={showingCandidate ? "default" : "outline"}
          aria-pressed={showingCandidate}
          onClick={() => onAccountTypeChange("candidate")}
        >
          Candidato
        </Button>
        <Button
          type="button"
          variant={showingCandidate ? "outline" : "default"}
          aria-pressed={!showingCandidate}
          onClick={() => onAccountTypeChange("company")}
        >
          Empresa
        </Button>
      </nav>
      <div hidden={!showingCandidate}>{candidate}</div>
      <main hidden={showingCandidate} className="mx-auto max-w-2xl px-6 py-8">
        {company}
      </main>
    </>
  );
}
