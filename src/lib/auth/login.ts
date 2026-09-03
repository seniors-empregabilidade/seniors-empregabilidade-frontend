import { ApiError } from "@/lib/api-error";
import { type LoginFormValues, sessionSchema } from "@/lib/schemas/login";


const MOCK_NETWORK_DELAY_MS = import.meta.env.MODE === "test" ? 0 : 600;

export async function login(credentials: LoginFormValues) {
  await wait(MOCK_NETWORK_DELAY_MS);

  if (credentials.password === "incorreta") {
    throw new ApiError({
      message: "E-mail ou senha incorretos",
      status: 401,
      code: "invalid_credentials",
    });
  }

  const fieldErrors = mockFieldErrors(credentials.email);

  if (fieldErrors) {
    throw new ApiError({
      message: "Revise os campos informados.",
      status: 422,
      errors: fieldErrors,
    });
  }

  const role = credentials.email.startsWith("empresa@")
    ? "empresa"
    : "candidato";

  return sessionSchema.parse({ role });
}

function mockFieldErrors(email: string): Record<string, string[]> | undefined {
  if (email === "invalido@exemplo.com") {
    return { email: ["E-mail inválido"] };
  }

  return undefined;
}

function wait(durationMs: number) {
  if (durationMs === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
