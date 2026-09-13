import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function BrandMark() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="size-2.5 rounded-full bg-foreground" />
      <span className="size-2.5 rounded-full bg-foreground-2" />
      <span className="size-2.5 rounded-full bg-border" />
    </span>
  );
}

const navLink =
  "rounded-md text-base text-foreground-2 underline underline-offset-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function SiteHeader({
  variant = "app",
}: {
  variant?: "app" | "landing";
}) {
  return (
    <header className="border-b border-border bg-background">
      <div
        className={cn(
          "mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4",
          variant === "landing" ? "max-w-6xl" : "max-w-2xl",
        )}
      >
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <BrandMark />
          <span className="block">
            <span className="block text-xl font-bold text-foreground">
              Seniors
            </span>
            <span className="block text-base text-muted-foreground">
              Conectando experiência a novas oportunidades
            </span>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="flex flex-wrap items-center gap-6"
        >
          {variant === "landing" ? (
            <>
              <span className="text-base text-foreground-2">Vagas</span>
              <span className="text-base text-foreground-2">Empresas</span>
              <span className="text-base text-foreground-2">Capacitação</span>
              <Link to="/" hash="como-funciona" className={navLink}>
                Como funciona
              </Link>
              <Link to="/login" className={navLink}>
                Entrar
              </Link>
              <Link to="/cadastro" className={buttonVariants()}>
                Criar conta
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={navLink}>
                Página inicial
              </Link>
              <Link to="/login" className={navLink}>
                Entrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
