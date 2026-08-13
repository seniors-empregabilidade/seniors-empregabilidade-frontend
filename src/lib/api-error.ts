import axios from "axios";
import { z } from "zod";

const problemDetailsSchema = z.object({
  type: z.string().default("about:blank"),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  request_id: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

interface ApiErrorOptions {
  message: string;
  status?: number | undefined;
  code?: string | undefined;
  errors?: Record<string, string[]> | undefined;
  requestId?: string | undefined;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly errors: Record<string, string[]> | undefined;
  readonly requestId: string | undefined;

  constructor({
    message,
    status,
    code,
    errors,
    requestId,
    cause,
  }: ApiErrorOptions) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.requestId = requestId;
  }
}

function readRequestId(headers: unknown): string | undefined {
  if (headers === null || typeof headers !== "object") {
    return undefined;
  }

  const value: unknown = Reflect.get(headers, "x-request-id");

  return typeof value === "string" ? value : undefined;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const parsed = problemDetailsSchema.safeParse(error.response?.data);
    const headerRequestId = readRequestId(error.response?.headers);

    if (parsed.success) {
      const problem = parsed.data;

      return new ApiError({
        message: problem.detail ?? problem.title,
        status: problem.status,
        code: problem.code,
        errors: problem.errors,
        requestId: problem.request_id ?? headerRequestId,
        cause: error,
      });
    }

    return new ApiError({
      message: "Não foi possível concluir a comunicação com o servidor.",
      status: error.response?.status,
      requestId: headerRequestId,
      cause: error,
    });
  }

  return new ApiError({
    message: "Ocorreu um erro inesperado.",
    cause: error,
  });
}
