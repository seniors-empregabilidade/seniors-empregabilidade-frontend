import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

function isViaCepResponse(data: unknown): data is ViaCepResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const response = data as Record<string, unknown>;

  return (
    (response.cep === undefined || typeof response.cep === "string") &&
    (response.logradouro === undefined ||
      typeof response.logradouro === "string") &&
    (response.bairro === undefined || typeof response.bairro === "string") &&
    (response.localidade === undefined ||
      typeof response.localidade === "string") &&
    (response.uf === undefined || typeof response.uf === "string") &&
    (response.erro === undefined || typeof response.erro === "boolean")
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function UserRegister() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [telefone, setTelefone] = useState("");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [consultandoCep, setConsultandoCep] = useState(false);
  const [cepValido, setCepValido] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function consultarCep(cepValue: string) {
    const cepNumbers = cepValue.replace(/\D/g, "");

    if (cepNumbers.length !== 8) {
      setCepValido(false);
      return;
    }

    setConsultandoCep(true);

    setErrors((currentErrors) => {
      const newErrors = { ...currentErrors };
      delete newErrors.cep;
      return newErrors;
    });

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepNumbers}/json/`,
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar o CEP.");
      }

      const responseText = await response.text();
      const data = parseJson(responseText);

      if (!isViaCepResponse(data)) {
        throw new Error("Resposta inválida da API.");
      }

      if (data.erro) {
        setCepValido(false);

        setLogradouro("");
        setBairro("");
        setCidade("");
        setEstado("");

        setErrors((currentErrors) => ({
          ...currentErrors,
          cep: "Não encontramos esse CEP. Verifique os números e tente novamente.",
        }));

        return;
      }

      setLogradouro(data.logradouro ?? "");
      setBairro(data.bairro ?? "");
      setCidade(data.localidade ?? "");
      setEstado(data.uf ?? "");
      setCepValido(true);
    } catch {
      setCepValido(false);

      setErrors((currentErrors) => ({
        ...currentErrors,
        cep: "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
      }));
    } finally {
      setConsultandoCep(false);
    }
  }

  function handleCepChange(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 8);

    let formatted = numbers;

    if (numbers.length > 5) {
      formatted = numbers.substring(0, 5) + "-" + numbers.substring(5);
    }

    setCep(formatted);
    setCepValido(false);

    setLogradouro("");
    setBairro("");
    setCidade("");
    setEstado("");

    setErrors((currentErrors) => {
      const newErrors = { ...currentErrors };
      delete newErrors.cep;
      return newErrors;
    });

    if (numbers.length === 8) {
      void consultarCep(numbers);
    }
  }

  function handleTelefoneChange(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    let formatted = numbers;

    if (numbers.length > 2) {
      formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
    }

    if (numbers.length > 6) {
      formatted = `(${numbers.substring(0, 2)}) ${numbers.substring(
        2,
        7,
      )}-${numbers.substring(7)}`;
    }

    setTelefone(formatted);
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

    if (!telefone.trim()) {
      newErrors.telefone = "Informe seu telefone.";
    }

    if (!cep.trim()) {
      newErrors.cep = "Informe seu CEP.";
    } else if (!cepValido) {
      newErrors.cep = "Informe um CEP válido antes de continuar.";
    }

    if (!senha) {
      newErrors.senha = "Informe uma senha.";
    } else if (senha.length < 8) {
      newErrors.senha = "A senha deve ter no mínimo 8 caracteres.";
    } else if (!/[A-Za-z]/.test(senha)) {
      newErrors.senha = "A senha deve conter pelo menos uma letra.";
    } else if (!/\d/.test(senha)) {
      newErrors.senha = "A senha deve conter pelo menos um número.";
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = "Confirme sua senha.";
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem.";
    }

    setErrors(newErrors);
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
              aria-describedby={errors.nome ? "nome-error" : "nome-description"}
            />

            <p id="nome-description" className="text-sm text-foreground">
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
            <Label htmlFor="telefone" className="text-base font-semibold">
              Telefone <span aria-hidden="true">*</span>
            </Label>

            <Input
              id="telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(event) => handleTelefoneChange(event.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.telefone)}
              aria-describedby={errors.telefone ? "telefone-error" : undefined}
            />

            {errors.telefone && (
              <p
                id="telefone-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.telefone}
              </p>
            )}
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

          <fieldset className="space-y-6">
            <legend className="text-xl font-semibold">Endereço</legend>

            <div className="space-y-2">
              <Label htmlFor="cep" className="text-base font-semibold">
                CEP <span aria-hidden="true">*</span>
              </Label>

              <Input
                id="cep"
                name="cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={cep}
                onChange={(event) => handleCepChange(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.cep)}
                aria-describedby={errors.cep ? "cep-error" : "cep-description"}
              />

              <p id="cep-description" className="text-sm text-foreground">
                Digite seu CEP para preencher o endereço automaticamente.
              </p>

              {consultandoCep && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Consultando CEP...
                </p>
              )}

              {errors.cep && (
                <p
                  id="cep-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.cep}
                </p>
              )}

              {cepValido && !consultandoCep && (
                <p className="text-sm text-green-700" role="status">
                  Endereço encontrado.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logradouro" className="text-base font-semibold">
                Logradouro
              </Label>

              <Input
                id="logradouro"
                name="logradouro"
                type="text"
                autoComplete="street-address"
                value={logradouro}
                onChange={(event) => setLogradouro(event.target.value)}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-base font-semibold">
                  Bairro
                </Label>

                <Input
                  id="bairro"
                  name="bairro"
                  type="text"
                  autoComplete="address-level3"
                  value={bairro}
                  onChange={(event) => setBairro(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-base font-semibold">
                  Cidade
                </Label>

                <Input
                  id="cidade"
                  name="cidade"
                  type="text"
                  autoComplete="address-level2"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-base font-semibold">
                Estado
              </Label>

              <Input
                id="estado"
                name="estado"
                type="text"
                autoComplete="address-level1"
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
              />
            </div>
          </fieldset>

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
                aria-describedby="senha-description"
                className="pr-12"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 text-base font-semibold"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <>
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" aria-hidden="true" />
                    Mostrar
                  </>
                )}
              </button>
            </div>

            <p id="senha-description" className="text-sm text-foreground">
              A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma
              letra e um número.
            </p>

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
                className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 text-base font-semibold"
                aria-label={
                  mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {mostrarConfirmarSenha ? (
                  <>
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" aria-hidden="true" />
                    Mostrar
                  </>
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
            className="h-14 w-full bg-[#1D4ED8] text-lg text-white hover:bg-[#1E40AF]"
            disabled={!aceitouTermos || consultandoCep}
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
