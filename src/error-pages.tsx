import { Button, buttonVariants } from "@/components/ui/button";

interface ApplicationErrorPageProps {
  errorMessage?: string | undefined;
  onRetry: () => void;
}

export function ApplicationErrorPage({
  errorMessage,
  onRetry,
}: ApplicationErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm font-medium text-muted-foreground">
        Erro inesperado
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Não foi possível carregar esta página.
      </h1>
      <p className="text-muted-foreground">
        Tente novamente. Se o problema continuar, informe a equipe responsável.
      </p>
      {errorMessage ? (
        <pre className="overflow-auto rounded-md bg-muted p-4 text-sm">
          {errorMessage}
        </pre>
      ) : null}
      <div>
        <Button type="button" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm font-medium text-muted-foreground">Erro 404</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Página não encontrada.
      </h1>
      <p className="text-muted-foreground">
        O endereço informado não existe ou foi alterado.
      </p>
      <div>
        <a href="/" className={buttonVariants()}>
          Voltar ao início
        </a>
      </div>
    </main>
  );
}
