import { z } from "zod";

const envSchema = z.object({
  // O valor padrão serve ao desenvolvimento local. Em produção ele é uma
  // armadilha: se a variável não chegar ao build, o zod aceitaria o padrão em
  // silêncio e a SPA publicada chamaria localhost. Exigir a variável faz a
  // aplicação falhar alto ao carregar, em vez de falhar calada em cada request.
  VITE_API_URL: import.meta.env.PROD
    ? z
        .string()
        .url()
        .transform((value) => value.replace(/\/$/, ""))
    : z
        .string()
        .url()
        .default("http://localhost:8000/api/v1")
        .transform((value) => value.replace(/\/$/, "")),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error("Invalid frontend environment configuration", {
      cause: result.error,
    });
  }

  return result.data;
}

export const env = parseEnv(import.meta.env);
