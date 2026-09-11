import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import { digits, type CompanyRegistrationValues } from "./registration-schema";

const registrySchema = z.object({
  cnpj: z.string(),
  legal_name: z.string(),
  trade_name: z.string().nullable(),
  primary_cnae: z.string(),
});
const addressSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string().min(1),
  uf: z.string().length(2),
  erro: z.union([z.boolean(), z.string()]).optional(),
});
const registrationSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  status: z.literal("pending"),
  email_confirmation_required: z.boolean(),
});
export type CompanyRegistration = z.infer<typeof registrationSchema>;

export async function getCompanyRecord(cnpj: string, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(
    `/company-registry-records/${cnpj}`,
    signal ? { signal } : {},
  );
  const record = registrySchema.safeParse(response.data);
  if (!record.success || record.data.cnpj !== cnpj)
    throw new ApiError({
      message: "Não foi possível validar a resposta da consulta de CNPJ.",
      code: "cnpj_provider_unavailable",
    });
  return record.data;
}

export async function getPostalAddress(zipCode: string, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(
    `https://viacep.com.br/ws/${zipCode}/json/`,
    signal ? { signal } : {},
  );
  const parsed = addressSchema.safeParse(response.data);
  if (
    !parsed.success ||
    parsed.data.erro ||
    digits(parsed.data.cep) !== zipCode
  ) {
    throw new ApiError({
      message:
        "Não encontramos esse CEP. Confira os números e tente novamente.",
      code: "postal_code_not_found",
    });
  }
  return parsed.data;
}

export async function registerCompany(
  values: CompanyRegistrationValues,
): Promise<CompanyRegistration> {
  const response = await apiClient.post<unknown>("/companies", {
    cnpj: digits(values.cnpj),
    display_name: values.display_name,
    corporate_email: values.corporate_email.trim().toLowerCase(),
    linkedin_url: values.linkedin_url || null,
    address: {
      ...values.address,
      zip_code: digits(values.address.zip_code),
      complement: values.address.complement || null,
    },
    password: values.password,
    terms_accepted: values.terms_accepted,
    terms_version: "v1",
  });
  const registration = registrationSchema.safeParse(response.data);
  if (!registration.success)
    throw new ApiError({
      message: "Não foi possível validar a resposta do cadastro.",
      code: "invalid_registration_response",
    });
  return registration.data;
}

export async function confirmCompanyEmail(
  email: string,
  code: string,
): Promise<void> {
  await apiClient.post("/email-verification/confirm", { email, code });
}

export async function resendCompanyCode(email: string): Promise<void> {
  await apiClient.post("/email-verification/send", { email });
}
