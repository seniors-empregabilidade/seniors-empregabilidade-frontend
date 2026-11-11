import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          {/* O nome "Seniors" já faz parte da imagem: o alt o expõe aos leitores de tela. */}
          <img
            src="/images/logo/logo-horizontal-transparente.png"
            alt="Seniors"
            width={142}
            height={48}
            className="h-12 w-auto"
          />
          {/* Quebra em duas linhas para não alargar o cabeçalho e empurrar o menu. */}
          <span className="block max-w-56 text-base leading-snug text-muted-foreground">
            Conectando experiência a novas oportunidades
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
