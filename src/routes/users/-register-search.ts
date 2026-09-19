import { z } from "zod";

export const registerSearchSchema = z.object({
  tipo: z.enum(["candidato", "empresa"]).catch("candidato"),
});
