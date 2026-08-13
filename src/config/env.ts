import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z
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
