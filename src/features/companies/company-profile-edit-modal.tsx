import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { type FieldPath, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-error";

import { getPostalAddress } from "./company-api";
import {
  type CompanyProfile,
  companyProfileQueryKey,
  updateCompanyProfile,
} from "./company-profile";
import {
  companyProfileFormSchema,
  type CompanyProfileFormValues,
  companyProfileSaveFailure,
  toFormValues,
  toUpdateRequest,
} from "./company-profile-form";
import {
  digits,
  maskCnpj,
  maskedCaret,
  maskZipCode,
} from "./registration-schema";

interface CompanyProfileEditModalProps {
  profile: CompanyProfile;
  /** Runs only after the API confirmed the change, with the profile it stored. */
  onSaved: (profile: CompanyProfile) => void;
}

export function CompanyProfileEditModal({
  profile,
  onSaved,
}: CompanyProfileEditModalProps) {
  const [open, setOpen] = useState(false);
  // A new key makes the next opening start from the profile again, discarding
  // whatever was typed and not saved.
  const [formKey, setFormKey] = useState(0);
  // A refused or lost save may mean the stored profile is not what the page
  // shows. It refreshes once the modal closes, not under the open form.
  const profileMayBeStale = useRef(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateCompanyProfile,
    retry: false,
    gcTime: 0,
    // The PUT answers with the stored profile, so the page shows it without
    // asking again.
    onSuccess: (saved) =>
      queryClient.setQueryData(companyProfileQueryKey, saved),
    onError: () => {
      profileMayBeStale.current = true;
    },
  });

  function discard() {
    setOpen(false);
    setFormKey((key) => key + 1);
    if (profileMayBeStale.current) {
      profileMayBeStale.current = false;
      void queryClient.invalidateQueries({ queryKey: companyProfileQueryKey });
    }
  }

  async function save(values: CompanyProfileFormValues) {
    try {
      const saved = await mutation.mutateAsync(toUpdateRequest(values));
      discard();
      onSaved(saved);
    } finally {
      mutation.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-request would hide whether the change was saved.
        if (!nextOpen && mutation.isPending) return;
        if (nextOpen) setOpen(true);
        else discard();
      }}
    >
      <DialogTrigger render={<Button type="button">Editar perfil</Button>} />
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar perfil da empresa</DialogTitle>
          <DialogDescription>
            Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <CompanyProfileForm
          key={formKey}
          profile={profile}
          pending={mutation.isPending}
          onSubmit={save}
        />
      </DialogContent>
    </Dialog>
  );
}

const legendClassName = "mb-4 text-xl font-bold text-foreground";

interface CompanyProfileFormProps {
  profile: CompanyProfile;
  pending: boolean;
  /** Saves the values; rejects when the API refused them or was unreachable. */
  onSubmit: (values: CompanyProfileFormValues) => Promise<void>;
}

function CompanyProfileForm({
  profile,
  pending,
  onSubmit,
}: CompanyProfileFormProps) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name.replace(".", "-")}`;
  const [generalError, setGeneralError] = useState<string | null>(null);
  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: toFormValues(profile),
  });
  const {
    register,
    control,
    setValue,
    setError,
    clearErrors,
    setFocus,
    getFieldState,
    formState,
    handleSubmit,
  } = form;

  // The saved CEP is not looked up again on opening: the address already on
  // the profile, possibly typed by hand, must not be overwritten.
  const savedZipCode = digits(profile.address?.zip_code ?? "");
  const zipCode = digits(useWatch({ control, name: "address.zip_code" }));
  const lookUpZipCode = /^\d{8}$/.test(zipCode) && zipCode !== savedZipCode;
  const postalAddress = useQuery({
    queryKey: ["postal-address", zipCode],
    queryFn: ({ signal }) => getPostalAddress(zipCode, signal),
    enabled: lookUpZipCode,
    retry: false,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
  const foundAddress = lookUpZipCode ? postalAddress.data : undefined;
  const lookingUp = lookUpZipCode && postalAddress.isFetching;
  const lookupFailed = lookUpZipCode && postalAddress.isError;

  useEffect(() => {
    if (!foundAddress) return;
    const options = { shouldDirty: true };
    setValue("address.street", foundAddress.logradouro, options);
    setValue("address.neighborhood", foundAddress.bairro, options);
    setValue("address.city", foundAddress.localidade, options);
    setValue("address.state", foundAddress.uf, options);
    clearErrors([
      "address.street",
      "address.neighborhood",
      "address.city",
      "address.state",
    ]);
  }, [foundAddress, setValue, clearErrors]);

  const busy = pending || formState.isSubmitting;
  const postalAnnouncement = lookingUp
    ? "Consultando CEP…"
    : foundAddress
      ? `Endereço preenchido pelo CEP: ${foundAddress.localidade} - ${foundAddress.uf}.`
      : "";

  async function submit(values: CompanyProfileFormValues) {
    setGeneralError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const failure = companyProfileSaveFailure(error);
      setGeneralError(failure.message);
      for (const { field, message } of failure.fields) {
        setError(field, { type: "server", message });
      }
      const first = failure.fields[0];
      if (first) setFocus(first.field);
    }
  }

  function field(
    name: FieldPath<CompanyProfileFormValues>,
    label: string,
    options: { type?: string; autoComplete?: string; optional?: boolean } = {},
  ) {
    const id = fieldId(name);
    const error = getFieldState(name, formState).error;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {options.optional ? " (opcional)" : " *"}
        </Label>
        <Input
          {...register(name)}
          id={id}
          type={options.type ?? "text"}
          autoComplete={options.autoComplete ?? "off"}
          aria-required={!options.optional}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-destructive">
            {error.message}
          </p>
        ) : null}
      </div>
    );
  }

  const zipId = fieldId("address.zip_code");
  const zipError = formState.errors.address?.zip_code;
  const cnpjId = fieldId("cnpj");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="space-y-8"
      aria-busy={busy}
    >
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className={legendClassName}>Dados da empresa</legend>
        {field("display_name", "Nome da empresa", {
          autoComplete: "organization",
        })}
        {field("legal_name", "Razão social")}
        <div className="space-y-2">
          <Label htmlFor={cnpjId}>CNPJ</Label>
          <Input
            id={cnpjId}
            value={maskCnpj(profile.cnpj)}
            readOnly
            aria-describedby={`${cnpjId}-hint`}
          />
          <p id={`${cnpjId}-hint`} className="text-base text-muted-foreground">
            O CNPJ não pode ser alterado por aqui. Para corrigir, fale com o
            suporte.
          </p>
        </div>
        {field("industry", "Área de atuação", { optional: true })}
      </fieldset>

      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className={legendClassName}>Contato</legend>
        {field("contact_email", "E-mail de contato", {
          type: "email",
          autoComplete: "email",
        })}
        {field("contact_phone", "Telefone", {
          type: "tel",
          autoComplete: "tel",
          optional: true,
        })}
      </fieldset>

      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className={legendClassName}>Endereço</legend>
        <div className="space-y-2">
          <Label htmlFor={zipId}>CEP *</Label>
          <Input
            {...register("address.zip_code", {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                const input = event.target;
                const caret = input.selectionStart ?? input.value.length;
                const typedBeforeCaret = digits(
                  input.value.slice(0, caret),
                ).length;
                const masked = maskZipCode(input.value);
                setValue("address.zip_code", masked);
                const position = maskedCaret(masked, typedBeforeCaret);
                requestAnimationFrame(() => {
                  if (document.activeElement === input)
                    input.setSelectionRange(position, position);
                });
              },
            })}
            id={zipId}
            inputMode="numeric"
            maxLength={9}
            autoComplete="postal-code"
            aria-required="true"
            aria-invalid={Boolean(zipError) || lookupFailed}
            aria-describedby={`${zipId}-feedback`}
          />
          <div id={`${zipId}-feedback`} className="space-y-2">
            {zipError ? (
              <p role="alert" className="text-destructive">
                {zipError.message}
              </p>
            ) : null}
            <p role="status" aria-live="polite">
              {postalAnnouncement}
            </p>
            {lookupFailed ? (
              <>
                <p role="alert" className="text-destructive">
                  {postalAddress.error instanceof ApiError &&
                  postalAddress.error.code === "postal_code_not_found"
                    ? postalAddress.error.message
                    : "Não foi possível consultar o CEP."}{" "}
                  Você pode preencher o endereço manualmente.
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
            ) : null}
          </div>
        </div>
        {field("address.street", "Logradouro", {
          autoComplete: "address-line1",
        })}
        <div className="grid gap-6 sm:grid-cols-2">
          {field("address.number", "Número")}
          {field("address.complement", "Complemento", {
            autoComplete: "address-line2",
            optional: true,
          })}
        </div>
        {field("address.neighborhood", "Bairro")}
        <div className="grid gap-6 sm:grid-cols-2">
          {field("address.city", "Cidade", {
            autoComplete: "address-level2",
          })}
          {field("address.state", "Estado (UF)", {
            autoComplete: "address-level1",
          })}
        </div>
        <p className="text-base text-muted-foreground">
          Ao mudar o CEP, o endereço é preenchido automaticamente. Se faltar o
          logradouro ou o bairro, complete à mão.
        </p>
      </fieldset>

      {generalError ? (
        <p role="alert" className="text-destructive">
          {generalError}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose
          disabled={busy}
          render={
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          }
        />
        <Button type="submit" disabled={busy || lookingUp}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
