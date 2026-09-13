import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

function isViaCepResponse(data: unknown): data is ViaCepResponse {
  if (typeof data !== "object" || data === null) return false;
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

function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function hasMinimumAge(birthDateString: string, minAge: number): boolean {
  const birthDate = parseLocalDate(birthDateString);
  if (!birthDate || isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= minAge;
}

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Informe seu nome completo.")
      .refine(
        (val) => val.trim().split(" ").length >= 2,
        "Informe seu nome e sobrenome.",
      ),
    cpf: z
      .string()
      .min(1, "Informe seu CPF.")
      .refine(
        (val) => val.replace(/\D/g, "").length === 11,
        "O CPF deve conter 11 dígitos.",
      ),
    birthDate: z
      .string()
      .min(1, "Informe sua data de nascimento.")
      .refine(
        (val) => hasMinimumAge(val, 45),
        "A idade mínima para cadastro é de 45 anos.",
      ),
    phone: z
      .string()
      .min(1, "Informe seu telefone.")
      .refine(
        (val) => val.replace(/\D/g, "").length >= 10,
        "Telefone incompleto. Digite DDD + número.",
      ),
    email: z
      .string()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail válido (ex: nome@dominio.com)."),
    cep: z
      .string()
      .min(1, "Informe seu CEP.")
      .refine(
        (val) => val.replace(/\D/g, "").length === 8,
        "CEP incompleto. Digite os 8 números.",
      ),
    street: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
      .regex(/\d/, "A senha deve conter pelo menos um número."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    acceptedTerms: z
      .boolean()
      .refine((val) => val === true, "Você precisa aceitar os termos de uso."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCEP(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, "$1-$2");
}

export function ProfessionalRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isCepValid, setIsCepValid] = useState(false);

  const cepAbortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    shouldFocusError: true,
    defaultValues: {
      name: "",
      cpf: "",
      birthDate: "",
      email: "",
      phone: "",
      cep: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });

  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 45);
  const maxDateString = maxBirthDate.toISOString().split("T")[0];

  function clearAddressFields() {
    setValue("street", "");
    setValue("neighborhood", "");
    setValue("city", "");
    setValue("state", "");
  }

  async function fetchAddressByCep(cepValue: string) {
    const cepNumbers = cepValue.replace(/\D/g, "");
    if (cepNumbers.length !== 8) return;

    if (cepAbortControllerRef.current) {
      cepAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    cepAbortControllerRef.current = controller;

    setIsFetchingCep(true);
    clearErrors("cep");

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepNumbers}/json/`,
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) throw new Error("Erro ao consultar o CEP.");

      const rawData = (await response.json()) as unknown;
      if (!isViaCepResponse(rawData) || rawData.erro) {
        setIsCepValid(false);
        clearAddressFields();
        setError("cep", {
          type: "manual",
          message:
            "CEP não encontrado. Verifique os números e tente novamente.",
        });
        return;
      }

      setValue("street", rawData.logradouro ?? "");
      setValue("neighborhood", rawData.bairro ?? "");
      setValue("city", rawData.localidade ?? "");
      setValue("state", rawData.uf ?? "");
      setIsCepValid(true);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setIsCepValid(false);
      setError("cep", {
        type: "manual",
        message:
          "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
      });
    } finally {
      if (cepAbortControllerRef.current === controller) {
        setIsFetchingCep(false);
      }
    }
  }

  async function onSubmit(data: RegisterFormData) {
    try {
      await apiClient.post("/users/register", {
        ...data,
        cpf: data.cpf.replace(/\D/g, ""),
        phone: data.phone.replace(/\D/g, ""),
        address: {
          cep: data.cep.replace(/\D/g, ""),
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        },
      });

      window.location.href = "/login";
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar profissional.";
      setError("root", { type: "manual", message });
    }
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

        {errors.root && (
          <div
            className="mb-6 rounded-md bg-destructive/15 p-4 text-sm text-destructive"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          noValidate
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Nome completo <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="name-description"
            />
            <p id="name-description" className="text-sm text-muted-foreground">
              Este é o nome que as empresas irão ver no seu currículo.
            </p>
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
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
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                aria-invalid={Boolean(errors.cpf)}
                {...register("cpf", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const formatted = formatCPF(e.target.value);
                    setValue("cpf", formatted);
                  },
                })}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.cpf.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-base font-semibold">
                Data de nascimento <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                min="1900-01-01"
                max={maxDateString}
                autoComplete="bday"
                {...register("birthDate")}
                aria-invalid={Boolean(errors.birthDate)}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.birthDate.message}
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
              type="text"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              aria-invalid={Boolean(errors.phone)}
              {...register("phone", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const formatted = formatPhone(e.target.value);
                  setValue("phone", formatted);
                },
              })}
            />
            {errors.phone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">
              E-mail <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
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
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                aria-invalid={Boolean(errors.cep)}
                {...register("cep")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const formatted = formatCEP(e.target.value);
                  setValue("cep", formatted);
                  setIsCepValid(false);

                  const digits = formatted.replace(/\D/g, "");

                  if (digits.length === 8) {
                    void fetchAddressByCep(digits);
                  } else {
                    if (cepAbortControllerRef.current) {
                      cepAbortControllerRef.current.abort();
                    }
                    setIsFetchingCep(false);
                    clearAddressFields();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Digite seu CEP para preencher o endereço automaticamente.
              </p>

              <div aria-live="polite">
                {isFetchingCep && (
                  <p className="text-sm text-muted-foreground">
                    Consultando CEP...
                  </p>
                )}
                {isCepValid && !isFetchingCep && (
                  <p
                    className="text-sm text-green-600 dark:text-green-500"
                    role="status"
                  >
                    Endereço encontrado.
                  </p>
                )}
              </div>

              {errors.cep && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.cep.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className="text-base font-semibold">
                Logradouro
              </Label>
              <Input id="street" type="text" {...register("street")} />
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
                  type="text"
                  {...register("neighborhood")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-base font-semibold">
                  Cidade
                </Label>
                <Input id="city" type="text" {...register("city")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-base font-semibold">
                Estado
              </Label>
              <Input id="state" type="text" {...register("state")} />
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-semibold">
              Senha <span aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={Boolean(errors.password)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma
              letra e um número.
            </p>
            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
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
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
                aria-invalid={Boolean(errors.confirmPassword)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                id="acceptedTerms"
                type="checkbox"
                {...register("acceptedTerms")}
                className="mt-1 h-5 w-5 accent-primary"
              />
              <Label
                htmlFor="acceptedTerms"
                className="text-base leading-6 font-normal"
              >
                Li e aceito os Termos de Uso e a Política de Privacidade.
              </Label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-sm text-destructive" role="alert">
                {errors.acceptedTerms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!acceptedTerms || isFetchingCep || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando...</span>
              </span>
            ) : (
              "Criar conta"
            )}
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
