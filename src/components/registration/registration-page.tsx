import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function RegistrationPage({
  candidate,
  company,
}: {
  candidate: ReactNode;
  company: ReactNode;
}) {
  const [accountType, setAccountType] = useState<"candidate" | "company">(
    "candidate",
  );
  return (
    <>
      <nav
        aria-label="Tipo de cadastro"
        className="mx-auto flex max-w-2xl gap-4 px-6 pt-8"
      >
        <Button
          type="button"
          variant={accountType === "candidate" ? "default" : "outline"}
          aria-pressed={accountType === "candidate"}
          onClick={() => setAccountType("candidate")}
        >
          Candidato
        </Button>
        <Button
          type="button"
          variant={accountType === "company" ? "default" : "outline"}
          aria-pressed={accountType === "company"}
          onClick={() => setAccountType("company")}
        >
          Empresa
        </Button>
      </nav>
      {accountType === "candidate" ? (
        candidate
      ) : (
        <main className="mx-auto max-w-2xl px-6 py-8">{company}</main>
      )}
    </>
  );
}
