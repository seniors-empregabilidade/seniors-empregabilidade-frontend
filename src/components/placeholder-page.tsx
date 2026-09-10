import { buttonVariants } from "@/components/ui/button";

interface PlaceholderPageProps {
  eyebrow: string;
  description: string;
}

export function PlaceholderPage({
  eyebrow,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-base font-medium text-muted-foreground">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Essa etapa ainda está em construção.
      </h1>
      <p className="text-foreground-2">{description}</p>
      <div>
        <a href="/" className={buttonVariants()}>
          Voltar para a página inicial
        </a>
      </div>
    </main>
  );
}
