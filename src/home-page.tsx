import { useState } from "react";

import { Button } from "@/components/ui/button";

export function HomePage() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-12">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Ambiente técnico
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Seniors – Empregabilidade
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          O frontend está configurado e pronto para receber as funcionalidades
          definidas pelo projeto.
        </p>

        <div className="mt-8">
          <Button
            type="button"
            aria-controls="technical-details"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((current) => !current)}
          >
            {showDetails
              ? "Ocultar detalhes técnicos"
              : "Ver detalhes técnicos"}
          </Button>
        </div>

        <section
          id="technical-details"
          aria-label="Detalhes técnicos"
          className="mt-8 rounded-lg bg-muted p-6"
          hidden={!showDetails}
        >
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            <li>React, TypeScript e Vite</li>
            <li>TanStack Router e TanStack Query</li>
            <li>shadcn/ui com Tailwind CSS e Base UI</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
