import { ApiError } from "@/lib/api-error";

const messages: Record<string, string> = {
  invalid_cnpj: "Informe um CNPJ válido.",
  cnpj_not_found: "Não encontramos esse CNPJ. Confira os números.",
  company_cnpj_conflict: "Já existe uma empresa cadastrada com esse CNPJ.",
  company_email_conflict:
    "Esse e-mail já está cadastrado. Use outro e-mail ou entre na sua conta.",
  identity_conflict:
    "Não foi possível vincular esse e-mail. Confira seus dados ou entre na sua conta.",
  company_email_domain_blocked:
    "Use um e-mail corporativo, como contato@suaempresa.com.br.",
  company_segment_blocked:
    "O ramo de atividade dessa empresa não é aceito na plataforma.",
  cnpj_provider_unavailable:
    "A consulta de CNPJ está indisponível. Seus dados foram mantidos; tente novamente.",
  identity_provider_unavailable:
    "Não foi possível concluir o cadastro agora. Seus dados foram mantidos. Se recebeu um código, confirme o e-mail antes de tentar novamente.",
  identity_confirmation_required:
    "Confirme seu e-mail com o código recebido e tente concluir o cadastro novamente.",
  invalid_verification_code:
    "Não foi possível confirmar com esse código. Confira se ele está correto e dentro do prazo. Se já confirmou, você pode entrar na sua conta.",
  too_many_attempts:
    "Houve muitas tentativas. Aguarde um pouco antes de tentar novamente.",
  password_policy_violation:
    "Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo.",
};
export function registrationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code)
    return (
      messages[error.code] ??
      "Não foi possível concluir. Confira os campos e tente novamente."
    );
  return "Não foi possível concluir a comunicação. Seus dados foram mantidos; tente novamente.";
}
