import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-6xl px-6";

function BrandMark() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="size-2.5 rounded-full bg-foreground" />
      <span className="size-2.5 rounded-full bg-foreground-2" />
      <span className="size-2.5 rounded-full bg-border" />
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div
        className={cn(
          container,
          "flex flex-wrap items-center justify-between gap-4 py-4",
        )}
      >
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <span className="block text-xl font-bold text-foreground">
              Seniors
            </span>
            <span className="block text-base text-muted-foreground">
              Conectando experiência a novas oportunidades
            </span>
          </div>
        </div>

        <nav
          aria-label="Principal"
          className="flex flex-wrap items-center gap-6"
        >
          <span className="text-base text-foreground-2">Vagas</span>
          <span className="text-base text-foreground-2">Empresas</span>
          <span className="text-base text-foreground-2">Capacitação</span>
          <a
            href="#como-funciona"
            className="text-base text-foreground-2 underline underline-offset-4 hover:text-foreground"
          >
            Como funciona
          </a>
          <a
            href="/login"
            className="text-base text-foreground-2 underline underline-offset-4 hover:text-foreground"
          >
            Entrar
          </a>
          <a href="/cadastro" className={buttonVariants()}>
            Criar conta
          </a>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="bg-muted">
      <div
        className={cn(
          container,
          "grid gap-12 py-16 lg:grid-cols-2 lg:items-center",
        )}
      >
        <div>
          <h1
            id="hero-heading"
            className="text-[42px] leading-[1.15] font-bold text-foreground"
          >
            Vinte anos de carreira não são um problema a resolver. São o que a
            empresa está procurando.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground-2">
            A Seniors conecta profissionais com 45 anos ou mais a empresas que
            contratam por competência. Você monta seu currículo, vê quais
            requisitos de cada vaga já atende e acompanha cada processo do
            início ao fim.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/cadastro" className={buttonVariants({ size: "lg" })}>
              Criar minha conta
            </a>
            <a
              href="#como-funciona"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Como funciona
            </a>
          </div>

          <Separator className="mt-8 bg-rule" />

          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {[
              "Gratuita para candidatos",
              "Empresas identificadas por CNPJ",
              "Sem filtro por idade",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                <span className="text-base text-foreground-2">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <p className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-background px-4 py-2 text-base font-medium text-foreground shadow-md">
            <span
              className="size-2.5 rounded-full bg-success"
              aria-hidden="true"
            />
            Perfil visível para empresas
          </p>
          <div
            data-imagem="landing-hero"
            aria-hidden="true"
            className="flex h-[388px] flex-col items-center justify-center rounded-xl border border-dashed border-input bg-background text-center"
          >
            <span className="text-base font-semibold tracking-wide text-muted-foreground">
              IMAGEM
            </span>
            <span className="mt-2 max-w-xs text-base text-muted-foreground">
              Foto de profissional 45+ em ambiente de trabalho. Arquivo a
              definir.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const whyChooseItems = [
  {
    title: "Vaga que diz o que faltou",
    description:
      "Cada vaga mostra quais requisitos você atende e qual não, item por item.",
  },
  {
    title: "Empresa identificada",
    description: "Toda vaga vem de uma empresa cadastrada com CNPJ e endereço.",
  },
  {
    title: "Capacitação ligada à vaga",
    description:
      "Cursos escolhidos a partir de requisitos que aparecem em vagas reais.",
  },
];

function WhyChooseSection() {
  return (
    <section aria-labelledby="why-choose-heading" className="bg-background">
      <div className={cn(container, "py-16")}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="why-choose-heading"
            className="text-[26px] font-bold text-foreground"
          >
            Por que escolher a Seniors
          </h2>
          <p className="mt-3 text-lg text-foreground-2">
            Uma plataforma feita para quem tem histórico e quer ser avaliado por
            ele.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {whyChooseItems.map((item) => (
            <Card key={item.title}>
              <CardContent>
                <span
                  className="flex size-10 items-center justify-center rounded-md bg-accent"
                  aria-hidden="true"
                >
                  <span className="size-2 rounded-full bg-foreground-2" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-base text-foreground-2">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    number: "01",
    title: "Monte seu currículo",
    description:
      "Em etapas curtas, com o que você fez e não com quando começou.",
  },
  {
    number: "02",
    title: "Veja o que cada vaga pede",
    description: "Requisito por requisito, antes de decidir se candidata.",
  },
  {
    number: "03",
    title: "Acompanhe cada processo",
    description:
      "Situação de cada candidatura, sem precisar ligar para ninguém.",
  },
];

function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-it-works-heading"
      className="bg-foreground"
    >
      <h2 id="how-it-works-heading" className="sr-only">
        Como funciona
      </h2>
      <div className={cn(container, "grid gap-10 py-16 md:grid-cols-3")}>
        {steps.map((step) => (
          <div key={step.number}>
            <p className="text-base font-semibold text-on-dark-accent">
              {step.number}
            </p>
            <h3 className="mt-2 text-xl font-bold text-on-dark">
              {step.title}
            </h3>
            <p className="mt-2 text-base text-on-dark-subtle">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GetStartedSection() {
  return (
    <section aria-labelledby="get-started-heading" className="bg-background">
      <h2 id="get-started-heading" className="sr-only">
        Comece agora
      </h2>
      <div className={cn(container, "grid gap-6 py-16 md:grid-cols-2")}>
        <Card className="bg-muted">
          <CardContent>
            <h3 className="text-xl font-bold text-foreground">
              Comece pelo seu currículo
            </h3>
            <p className="mt-2 text-base text-foreground-2">
              Você preenche uma vez e usa em todas as candidaturas. Leva cerca
              de 15 minutos.
            </p>
            <a
              href="/cadastro"
              className={buttonVariants({ className: "mt-6" })}
            >
              Criar minha conta
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="text-xl font-bold text-foreground">Para empresas</h3>
            <p className="mt-2 text-base text-foreground-2">
              Publique vagas e receba candidatos ordenados por requisitos
              atendidos. A plataforma não exibe a idade dos candidatos para as
              empresas.
            </p>
            <a
              href="/cadastro-empresa"
              className={buttonVariants({
                variant: "outline",
                className: "mt-6",
              })}
            >
              Cadastrar minha empresa
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const footerColumns = [
  {
    title: "Para candidatos",
    items: ["Buscar vagas", "Criar conta", "Capacitação", "Como usar"],
  },
  {
    title: "Para empresas",
    items: ["Cadastrar empresa", "Publicar vaga", "Buscar candidatos"],
  },
  {
    title: "Institucional",
    items: ["Sobre nós", "Contato", "Política de privacidade", "Termos de uso"],
  },
];

function SiteFooter() {
  return (
    <footer className="bg-foreground">
      <h2 className="sr-only">Links do rodapé</h2>
      <div
        className={cn(
          container,
          "grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]",
        )}
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-on-dark" />
              <span className="size-2.5 rounded-full bg-on-dark-subtle" />
              <span className="size-2.5 rounded-full bg-on-dark-accent" />
            </span>
            <span className="text-xl font-bold text-on-dark">Seniors</span>
          </div>
          <p className="mt-4 max-w-xs text-base text-on-dark-subtle">
            Plataforma de empregabilidade para profissionais com 45 anos ou
            mais.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-base font-semibold tracking-wide text-on-dark-muted uppercase">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {column.items.map((item) => (
                <li key={item} className="text-base text-on-dark-subtle">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={cn(container, "border-t border-on-dark-accent/20 py-6")}>
        <p className="text-base text-on-dark-subtle">
          Seniors Empregabilidade · AGES/PUCRS 2026-2
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <GetStartedSection />
      </main>
      <SiteFooter />
    </>
  );
}
