import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-error";

import {
  getCompanyRecord,
  getPostalAddress,
  registerCompany,
  type CompanyRegistration,
} from "./company-api";
import { EmailConfirmation } from "./email-confirmation";
import { registrationErrorMessage } from "./registration-errors";
import {
  companyRegistrationSchema,
  digits,
  isValidCnpj,
  maskCnpj,
  type CompanyRegistrationValues,
} from "./registration-schema";

const fieldNames: FieldPath<CompanyRegistrationValues>[] = [
  "cnpj",
  "display_name",
  "corporate_email",
  "linkedin_url",
  "password",
  "confirm_password",
  "terms_accepted",
  "address.zip_code",
  "address.street",
  "address.number",
  "address.complement",
  "address.neighborhood",
  "address.city",
  "address.state",
];
const defaults: CompanyRegistrationValues = {
  cnpj: "",
  display_name: "",
  corporate_email: "",
  linkedin_url: "",
  password: "",
  confirm_password: "",
  terms_accepted: false,
  address: {
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
};

export function CompanyRegistrationForm() {
  const form = useForm<CompanyRegistrationValues>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: defaults,
  });
  const {
    register,
    control,
    setValue,
    setError,
    clearErrors,
    getFieldState,
    formState,
    handleSubmit,
    getValues,
    setFocus,
  } = form;
  const cnpj = digits(useWatch({ control, name: "cnpj" }));
  const zipCode = digits(useWatch({ control, name: "address.zip_code" }));
  const accepted = useWatch({ control, name: "terms_accepted" });
  const [result, setResult] = useState<CompanyRegistration | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const record = useQuery({
    queryKey: ["company-registry", cnpj],
    queryFn: ({ signal }) => getCompanyRecord(cnpj, signal),
    enabled: isValidCnpj(cnpj),
    retry: false,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
  const postalAddress = useQuery({
    queryKey: ["postal-address", zipCode],
    queryFn: ({ signal }) => getPostalAddress(zipCode, signal),
    enabled: /^\d{8}$/.test(zipCode),
    retry: false,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (postalAddress.data) {
      setValue("address.street", postalAddress.data.logradouro);
      setValue("address.neighborhood", postalAddress.data.bairro);
      setValue("address.city", postalAddress.data.localidade);
      setValue("address.state", postalAddress.data.uf);
      clearErrors("address");
    }
  }, [postalAddress.data, setValue, clearErrors]);
  useEffect(() => {
    if (result) successHeading.current?.focus();
  }, [result]);

  const mutation = useMutation({
    mutationFn: registerCompany,
    retry: false,
    gcTime: 0,
  });
  const busy = mutation.isPending || formState.isSubmitting;

  async function submit(values: CompanyRegistrationValues) {
    if (busy) return;
    setGeneralError(null);
    if (!record.isSuccess || record.isFetching) {
      setError(
        "cnpj",
        { message: "Aguarde a consulta do CNPJ ou tente consultar novamente." },
        { shouldFocus: true },
      );
      return;
    }
    if (!postalAddress.isSuccess || postalAddress.isFetching) {
      setError(
        "address.zip_code",
        { message: "Consulte um CEP válido antes de continuar." },
        { shouldFocus: true },
      );
      return;
    }
    try {
      const created = await mutation.mutateAsync(values);
      setValue("password", "");
      setValue("confirm_password", "");
      setResult(created);
      setRecoveryEmail(null);
    } catch (error) {
      const message = registrationErrorMessage(error);
      setGeneralError(message);
      if (error instanceof ApiError) {
        let first: FieldPath<CompanyRegistrationValues> | undefined;
        for (const key of Object.keys(error.errors ?? {})) {
          const field = fieldNames.find(
            (name) => name === key.replace(/^body\./, ""),
          );
          if (field) {
            setError(field, {
              type: "server",
              message:
                error.code === "validation_error"
                  ? "Confira o valor deste campo."
                  : message,
            });
            first ??= field;
          }
        }
        if (first) setFocus(first);
        if (error.code === "identity_confirmation_required")
          setRecoveryEmail(values.corporate_email);
      }
    } finally {
      mutation.reset();
    }
  }

  function field(
    name: FieldPath<CompanyRegistrationValues>,
    label: string,
    options: {
      type?: string;
      autoComplete?: string;
      optional?: boolean;
      readOnly?: boolean;
    } = {},
  ) {
    const error = getFieldState(name, formState).error;
    return (
      <div className="space-y-2" key={name}>
        <Label htmlFor={name}>
          {label}
          {options.optional ? " (opcional)" : " *"}
        </Label>
        <Input
          {...register(name)}
          id={name}
          type={options.type ?? "text"}
          autoComplete={options.autoComplete}
          readOnly={options.readOnly}
          aria-required={!options.optional}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {error && (
          <p id={`${name}-error`} className="text-destructive" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }

  if (result)
    return (
      <section className="space-y-6 rounded-xl border border-border bg-card p-6 sm:p-10">
        <h1
          ref={successHeading}
          tabIndex={-1}
          className="text-3xl font-semibold"
        >
          Cadastro recebido
        </h1>
        <p role="status">
          Sua empresa está pendente de aprovação. Você poderá usar as
          funcionalidades empresariais depois da análise.
        </p>
        {result.email_confirmation_required && (
          <EmailConfirmation email={result.email} />
        )}
        <p>Confirmar o e-mail não aprova a empresa automaticamente.</p>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-foreground underline"
        >
          Ir para o login
        </a>
      </section>
    );

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-6 sm:p-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Dados da empresa</h1>
        <p>
          Cadastre sua organização para encontrar profissionais. Após o
          cadastro, a conta ficará pendente de aprovação.
        </p>
        <p>Os campos marcados com * são obrigatórios.</p>
      </header>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(submit)(event);
        }}
        className="space-y-8"
        aria-busy={busy}
      >
        <fieldset disabled={busy} className="space-y-6">
          <legend className="mb-4 text-2xl font-semibold">Organização</legend>
          {field("display_name", "Nome da empresa", {
            autoComplete: "organization",
          })}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                {...register("cnpj", {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("cnpj", maskCnpj(event.target.value));
                    clearErrors("cnpj");
                  },
                })}
                id="cnpj"
                inputMode="numeric"
                maxLength={18}
                aria-required="true"
                aria-invalid={Boolean(formState.errors.cnpj) || record.isError}
                aria-describedby="cnpj-feedback"
              />
              <div id="cnpj-feedback">
                {formState.errors.cnpj && (
                  <p role="alert" className="text-destructive">
                    {formState.errors.cnpj.message}
                  </p>
                )}
                {record.isFetching && <p role="status">Consultando CNPJ…</p>}
                {record.isError && (
                  <>
                    <p role="alert" className="text-destructive">
                      {registrationErrorMessage(record.error)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void record.refetch();
                      }}
                    >
                      Consultar CNPJ novamente
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-cnae">Ramo de atividade (CNAE)</Label>
              <Input
                id="primary-cnae"
                value={record.data?.primary_cnae ?? ""}
                readOnly
                aria-describedby="registry-explanation"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal-name">Razão social</Label>
            <Input
              id="legal-name"
              value={record.data?.legal_name ?? ""}
              readOnly
            />
          </div>
          <p id="registry-explanation">
            Razão social e CNAE são consultados pelo CNPJ. CNAE é o código que
            identifica a atividade econômica da empresa.
          </p>
          {field("linkedin_url", "LinkedIn da empresa", {
            type: "url",
            optional: true,
          })}
        </fieldset>
        <fieldset disabled={busy} className="space-y-6">
          <legend className="mb-4 text-2xl font-semibold">Endereço</legend>
          <div className="space-y-2">
            <Label htmlFor="address.zip_code">CEP *</Label>
            <Input
              {...register("address.zip_code", {
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  if (digits(event.target.value) !== zipCode) {
                    for (const name of [
                      "street",
                      "neighborhood",
                      "city",
                      "state",
                    ] as const)
                      setValue(`address.${name}`, "");
                  }
                  clearErrors("address.zip_code");
                },
              })}
              id="address.zip_code"
              inputMode="numeric"
              maxLength={9}
              autoComplete="postal-code"
              aria-required="true"
              aria-invalid={
                Boolean(formState.errors.address?.zip_code) ||
                postalAddress.isError
              }
              aria-describedby="postal-feedback"
            />
            <div id="postal-feedback">
              {formState.errors.address?.zip_code && (
                <p role="alert" className="text-destructive">
                  {formState.errors.address.zip_code.message}
                </p>
              )}
              {postalAddress.isFetching && (
                <p role="status">Consultando CEP…</p>
              )}
              {postalAddress.isError && (
                <>
                  <p role="alert" className="text-destructive">
                    {postalAddress.error instanceof ApiError &&
                    postalAddress.error.code === "postal_code_not_found"
                      ? postalAddress.error.message
                      : "Não foi possível consultar o CEP. Tente novamente."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void postalAddress.refetch();
                    }}
                  >
                    Consultar CEP novamente
                  </Button>
                </>
              )}
            </div>
          </div>
          {field("address.street", "Logradouro", {
            autoComplete: "address-line1",
          })}
          <div className="grid gap-6 sm:grid-cols-2">
            {field("address.number", "Número")}
            {field("address.complement", "Complemento", { optional: true })}
          </div>
          {field("address.neighborhood", "Bairro")}
          <div className="grid gap-6 sm:grid-cols-2">
            {field("address.city", "Cidade", {
              autoComplete: "address-level2",
              readOnly: true,
            })}
            {field("address.state", "Estado", {
              autoComplete: "address-level1",
              readOnly: true,
            })}
          </div>
          <p>
            Se o CEP não informar logradouro ou bairro, complete esses campos
            manualmente.
          </p>
        </fieldset>
        <fieldset disabled={busy} className="space-y-6">
          <legend className="mb-4 text-2xl font-semibold">Acesso</legend>
          {field("corporate_email", "E-mail corporativo", {
            type: "email",
            autoComplete: "email",
          })}
          {field("password", "Senha", {
            type: showPassword ? "text" : "password",
            autoComplete: "new-password",
          })}
          <Button
            type="button"
            variant="outline"
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {showPassword ? "Ocultar senha" : "Mostrar senha"}
          </Button>
          <p>
            Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número
            e símbolo.
          </p>
          {field("confirm_password", "Confirmar senha", {
            type: showConfirmation ? "text" : "password",
            autoComplete: "new-password",
          })}
          <Button
            type="button"
            variant="outline"
            aria-pressed={showConfirmation}
            onClick={() => setShowConfirmation(!showConfirmation)}
          >
            {showConfirmation ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {showConfirmation
              ? "Ocultar confirmação da senha"
              : "Mostrar confirmação da senha"}
          </Button>
        </fieldset>
        <label className="flex min-h-11 items-center gap-3">
          <input
            {...register("terms_accepted")}
            type="checkbox"
            disabled={busy}
            className="size-6"
          />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>
        {generalError && (
          <p role="alert" className="text-destructive">
            {generalError}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={
            !accepted || busy || record.isFetching || postalAddress.isFetching
          }
        >
          {busy ? "Criando conta…" : "Criar conta"}
        </Button>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-foreground underline"
        >
          Já tenho conta. Entrar
        </a>
      </form>
      {generalError && !recoveryEmail && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setRecoveryEmail(getValues("corporate_email"))}
        >
          Recebi um código e preciso confirmar meu e-mail
        </Button>
      )}
      {recoveryEmail && (
        <EmailConfirmation
          email={recoveryEmail}
          onConfirmed={() => {
            setRecoveryEmail(null);
            setFocus("display_name");
            setGeneralError(
              "E-mail confirmado. Confira seus dados e clique em Criar conta para concluir.",
            );
          }}
        />
      )}
    </section>
  );
}
