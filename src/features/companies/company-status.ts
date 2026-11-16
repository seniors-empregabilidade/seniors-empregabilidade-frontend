import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";

const companyStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "blocked",
]);

const companyStatusResponseSchema = z.object({
  id: z.uuid(),
  status: companyStatusSchema,
  rejection_reason: z.string().nullable(),
});

export type CompanyStatusResponse = z.infer<typeof companyStatusResponseSchema>;

export async function fetchCompanyStatus(
  signal?: AbortSignal,
): Promise<CompanyStatusResponse> {
  const response = await apiClient.get<unknown>(
    "/companies/me",
    signal ? { signal } : undefined,
  );
  return companyStatusResponseSchema.parse(response.data);
}

export const companyStatusQueryOptions = queryOptions({
  queryKey: ["company", "status"],
  queryFn: ({ signal }) => fetchCompanyStatus(signal),
  retry: false,
});
