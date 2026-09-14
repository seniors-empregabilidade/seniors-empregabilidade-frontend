import { z } from "zod";

export const passwordHint =
  "Use no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um símbolo (como !, @ ou #).";

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula na senha.")
  .regex(/[a-z]/, "Inclua pelo menos uma letra minúscula na senha.")
  .regex(/[0-9]/, "Inclua pelo menos um número na senha.")
  // Printable ASCII punctuation; spaces do not satisfy Cognito's symbol rule.
  .regex(
    /[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/,
    "Inclua pelo menos um símbolo na senha, como !, @ ou #.",
  );
