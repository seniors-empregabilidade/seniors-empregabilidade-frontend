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
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [phone, setPhone] = useState("");

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isCepValid, setIsCepValid] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function fetchAddressByCep(cepValue: string) {
    const cepNumbers = cepValue.replace(/\D/g, "");

    if (cepNumbers.length !== 8) {
      setIsCepValid(false);
      return;
    }

    setIsFetchingCep(true);

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
        setIsCepValid(false);

        setStreet("");
        setNeighborhood("");
        setCity("");
        setState("");

        setErrors((currentErrors) => ({
          ...currentErrors,
          cep: "Não encontramos esse CEP. Verifique os números e tente novamente.",
        }));

        return;
      }

      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
      setIsCepValid(true);
    } catch {
      setIsCepValid(false);

      setErrors((currentErrors) => ({
        ...currentErrors,
        cep: "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
      }));
    } finally {
      setIsFetchingCep(false);
    }
  }

  function handleCepChange(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 8);

    let formatted = numbers;

    if (numbers.length > 5) {
      formatted = numbers.substring(0, 5) + "-" + numbers.substring(5);
    }

    setCep(formatted);
    setIsCepValid(false);

    setStreet("");
    setNeighborhood("");
    setCity("");
    setState("");

    setErrors((currentErrors) => {
      const newErrors = { ...currentErrors };
      delete newErrors.cep;
      return newErrors;
    });

    if (numbers.length === 8) {
      void fetchAddressByCep(numbers);
    }
  }

  function handlePhoneChange(value: string) {
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

    setPhone(formatted);
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

    if (!name.trim()) {
      newErrors.name = "Informe seu nome completo.";
    }

    if (!cpf.trim()) {
      newErrors.cpf = "Informe seu CPF.";
    }

    if (!birthDate) {
      newErrors.birthDate = "Informe sua data de nascimento.";
    }

    if (!email.trim()) {
      newErrors.email = "Informe seu e-mail.";
    }

    if (!phone.trim()) {
      newErrors.phone = "Informe seu telefone.";
    }

    if (!cep.trim()) {
      newErrors.cep = "Informe seu CEP.";
    } else if (!isCepValid) {
      newErrors.cep = "Informe um CEP válido antes de continuar.";
    }

    if (!password) {
      newErrors.password = "Informe uma senha.";
    } else if (password.length < 8) {
      newErrors.password = "A senha deve ter no mínimo 8 caracteres.";
    } else if (!/[A-Za-z]/.test(password)) {
      newErrors.password = "A senha deve conter pelo menos uma letra.";
    } else if (!/\d/.test(password)) {
      newErrors.password = "A senha deve conter pelo menos um número.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
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
            <Label htmlFor="name" className="text-base font-semibold">
              Nome completo <span aria-hidden="true">*</span>
            </Label>

            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : "name-description"}
            />

            <p id="name-description" className="text-sm text-foreground">
              Este é o nome que as empresas verão no seu currículo.
            </p>

            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.name}
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
              <Label htmlFor="birthDate" className="text-base font-semibold">
                Data de nascimento <span aria-hidden="true">*</span>
              </Label>

              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                autoComplete="bday"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={
                  errors.birthDate ? "birth-date-error" : undefined
                }
              />

              {errors.birthDate && (
                <p
                  id="birth-date-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.birthDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold">
              Telefone <span aria-hidden="true">*</span>
            </Label>

            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />

            {errors.phone && (
              <p
                id="phone-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.phone}
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

              {isFetchingCep && (
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

              {isCepValid && !isFetchingCep && (
                <p className="text-sm text-green-700" role="status">
                  Endereço encontrado.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className="text-base font-semibold">
                Logradouro
              </Label>

              <Input
                id="street"
                name="street"
                type="text"
                autoComplete="street-address"
                value={street}
                onChange={(event) => setStreet(event.target.value)}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="neighborhood"
                  className="text-base font-semibold"
                >
                  Bairro
                </Label>

                <Input
                  id="neighborhood"
                  name="neighborhood"
                  type="text"
                  autoComplete="address-level3"
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-base font-semibold">
                  Cidade
                </Label>

                <Input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-base font-semibold">
                Estado
              </Label>

              <Input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                value={state}
                onChange={(event) => setState(event.target.value)}
              />
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-semibold">
              Senha <span aria-hidden="true">*</span>
            </Label>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby="password-description"
                className="pr-12"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 text-base font-semibold"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
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

            <p id="password-description" className="text-sm text-foreground">
              A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma
              letra e um número.
            </p>

            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-base font-semibold"
            >
              Confirmar senha <span aria-hidden="true">*</span>
            </Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                className="pr-12"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 text-base font-semibold"
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? (
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

            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <input
              id="acceptedTerms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-5 w-5"
            />

            <Label
              htmlFor="acceptedTerms"
              className="text-base leading-6 font-normal"
            >
              Li e aceito os Termos de Uso e a Política de Privacidade.
            </Label>
          </div>

          <Button
            type="submit"
            className="h-14 w-full bg-[#1D4ED8] text-lg text-white hover:bg-[#1E40AF]"
            disabled={!acceptedTerms || isFetchingCep}
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
