import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export function UserRegister() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!nome.trim()) {
      newErrors.nome = "Informe seu nome completo.";
    }

    if (!cpf.trim()) {
      newErrors.cpf = "Informe seu CPF.";
    }

    if (!dataNascimento) {
      newErrors.dataNascimento = "Informe sua data de nascimento.";
    }

    if (!email.trim()) {
      newErrors.email = "Informe seu e-mail.";
    }

    if (!senha) {
      newErrors.senha = "Informe uma senha.";
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = "Confirme sua senha.";
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem.";
    }

    setErrors(newErrors);
  }

  function handleCpfChange(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    let formatted = numbers;

    if (numbers.length > 3) {
      formatted = numbers.substring(0, 3) + "." + numbers.substring(3);
    }

    if (numbers.length > 6) {
      formatted =
        numbers.substring(0, 3) +
        "." +
        numbers.substring(3, 6) +
        "." +
        numbers.substring(6);
    }

    if (numbers.length > 9) {
      formatted =
        numbers.substring(0, 3) +
        "." +
        numbers.substring(3, 6) +
        "." +
        numbers.substring(6, 9) +
        "-" +
        numbers.substring(9);
    }

    setCpf(formatted);
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Dados do profissional
          </h1>

          <p className="mt-3 text-base leading-7 text-foreground">
            Preencha seus dados para se candidatar às vagas.
          </p>

          <p className="mt-3 text-base text-foreground">
            Os campos marcados com * são obrigatórios.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-semibold">
              Nome completo <span aria-hidden="true">*</span>
            </Label>

            <Input
              id="nome"
              name="nome"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.nome)}
              aria-describedby={errors.nome ? "nome-error" : undefined}
            />

            <p id="nome-description" className="text-sm text-muted-foreground">
              Este é o nome que as empresas verão no seu currículo.
            </p>

            {errors.nome && (
              <p
                id="nome-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.nome}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-base font-semibold">
                CPF <span aria-hidden="true">*</span>
              </Label>

              <Input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(event) => handleCpfChange(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.cpf)}
                aria-describedby={errors.cpf ? "cpf-error" : undefined}
              />

              {errors.cpf && (
                <p
                  id="cpf-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.cpf}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="dataNascimento"
                className="text-base font-semibold"
              >
                Data de nascimento <span aria-hidden="true">*</span>
              </Label>

              <Input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                autoComplete="bday"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.dataNascimento)}
                aria-describedby={
                  errors.dataNascimento ? "data-nascimento-error" : undefined
                }
              />

              {errors.dataNascimento && (
                <p
                  id="data-nascimento-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.dataNascimento}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">
              E-mail <span aria-hidden="true">*</span>
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />

            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-base font-semibold">
              Senha <span aria-hidden="true">*</span>
            </Label>

            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.senha)}
                aria-describedby={errors.senha ? "senha-error" : undefined}
                className="pr-12"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {errors.senha && (
              <p
                id="senha-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.senha}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha" className="text-base font-semibold">
              Confirmar senha <span aria-hidden="true">*</span>
            </Label>

            <div className="relative">
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type={mostrarConfirmarSenha ? "text" : "password"}
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.confirmarSenha)}
                aria-describedby={
                  errors.confirmarSenha ? "confirmar-senha-error" : undefined
                }
                className="pr-12"
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha((valor) => !valor)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center"
                aria-label={
                  mostrarConfirmarSenha
                    ? "Ocultar confirmação da senha"
                    : "Mostrar confirmação da senha"
                }
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            {errors.confirmarSenha && (
              <p
                id="confirmar-senha-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.confirmarSenha}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <input
              id="aceitouTermos"
              type="checkbox"
              checked={aceitouTermos}
              onChange={(event) => setAceitouTermos(event.target.checked)}
              className="mt-1 h-5 w-5"
            />

            <Label
              htmlFor="aceitouTermos"
              className="text-base leading-6 font-normal"
            >
              Li e aceito os Termos de Uso e a Política de Privacidade.
            </Label>
          </div>

          <Button
            type="submit"
            className="h-14 w-full text-lg"
            disabled={!aceitouTermos}
          >
            Criar conta
          </Button>

          <p className="text-center text-base">
            Já tenho uma conta?{" "}
            <a href="/login" className="font-semibold underline">
              Entrar
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
