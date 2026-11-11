import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError, toApiError } from "@/lib/api-error";

export const supportContactQueryKey = ["support", "contact"] as const;

// Same rule as the backend: digits only, country code first, 10 to 15 digits.
const supportContactSchema = z.object({
  whatsapp_number: z.string().regex(/^[1-9][0-9]{9,14}$/),
  initial_message: z.string().min(1).max(500),
});

export type SupportContact = z.infer<typeof supportContactSchema>;

export function supportWhatsAppUrl(contact: SupportContact): string {
  const url = new URL(`https://wa.me/${contact.whatsapp_number}`);
  url.searchParams.set("text", contact.initial_message);
  return url.toString();
}

/** `null` means the contact is not configured, so the button stays hidden. */
export async function fetchSupportContact(
  signal?: AbortSignal,
): Promise<SupportContact | null> {
  try {
    const response = await apiClient.get<unknown>("/support/contact", {
      ...(signal ? { signal } : {}),
    });
    const parsed = supportContactSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Não foi possível carregar o contato de suporte.",
        code: "invalid_support_contact",
      });
    }
    return parsed.data;
  } catch (error) {
    const apiError = toApiError(error);
    if (
      apiError.status === 404 &&
      apiError.code === "support_contact_not_configured"
    ) {
      return null;
    }
    throw apiError;
  }
}

export const supportContactQueryOptions = queryOptions({
  queryKey: supportContactQueryKey,
  queryFn: ({ signal }) => fetchSupportContact(signal),
  // A missing contact is an answer. Retrying it only delays hiding the button.
  retry: false,
});
