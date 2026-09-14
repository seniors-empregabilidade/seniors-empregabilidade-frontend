import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

interface RegistrationValues {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
  city?: string | undefined;
  state?: string | undefined;
}

const responseSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  email: z.email(),
  email_verification_required: z.boolean(),
});

export async function registerProfessional(values: RegistrationValues) {
  const response = await apiClient.post<unknown>("/professionals", {
    full_name: values.name.trim(),
    cpf: values.cpf.replace(/\D/g, ""),
    birth_date: values.birthDate,
    phone: values.phone.replace(/\D/g, ""),
    email: values.email.trim(),
    password: values.password,
    terms_version_accepted: "v1",
    ...(values.city?.trim() ? { city: values.city.trim() } : {}),
    ...(values.state?.trim()
      ? { state: values.state.trim().toUpperCase() }
      : {}),
  });
  return responseSchema.parse(response.data);
}

const fieldNames = {
  full_name: "name",
  cpf: "cpf",
  birth_date: "birthDate",
  phone: "phone",
  email: "email",
  password: "password",
  terms_version_accepted: "acceptedTerms",
  city: "city",
  state: "state",
} as const;

const messages: Record<string, string> = {
  invalid_cpf: "Este CPF não é válido. Confira os números digitados.",
  minimum_age_not_met: "É necessário ter 45 anos ou mais para criar uma conta.",
  terms_acceptance_required: "Aceite os Termos de Uso para criar sua conta.",
  cpf_already_registered:
    "Já existe uma conta com este CPF. Você pode entrar na sua conta.",
  email_already_registered:
    "Já existe uma conta com este e-mail. Você pode entrar na sua conta.",
  validation_error: "Confira os campos informados e tente novamente.",
  password_policy_violation:
    "A senha não atende aos requisitos. Revise sua senha e tente novamente.",
  identity_provider_unavailable:
    "O serviço de cadastro está indisponível. Tente novamente mais tarde.",
  too_many_attempts:
    "Foram feitas muitas tentativas. Aguarde antes de tentar novamente.",
};

export function registrationError(error: unknown) {
  const code = error instanceof ApiError ? error.code : undefined;
  const fields: Array<(typeof fieldNames)[keyof typeof fieldNames]> = [];
  if (error instanceof ApiError) {
    for (const key of Object.keys(error.errors ?? {})) {
      const name = key.replace(/^body\./, "");
      if (Object.hasOwn(fieldNames, name)) {
        fields.push(fieldNames[name as keyof typeof fieldNames]);
      }
    }
  }
  return {
    message:
      (code && Object.hasOwn(messages, code) ? messages[code] : undefined) ??
      "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
    fields,
    offerLogin:
      code === "cpf_already_registered" || code === "email_already_registered",
  };
}
