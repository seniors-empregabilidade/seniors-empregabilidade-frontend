import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { apiClient } from "@/lib/api-client";

export interface RecordedRequest {
  url: string | undefined;
  method: string | undefined;
  body: unknown;
  authorization: string | null;
}

export interface ApiStub {
  requests: RecordedRequest[];
  restore: () => void;
}

/**
 * Answer every apiClient call with a canned response, through the real
 * interceptors, so tests exercise the shipped error mapping instead of a double.
 */
export function stubApi(status: number, data: unknown): ApiStub {
  const original = apiClient.defaults.adapter;
  const requests: RecordedRequest[] = [];

  const adapter: AxiosAdapter = (config: InternalAxiosRequestConfig) => {
    requests.push({
      url: config.url,
      method: config.method,
      body:
        typeof config.data === "string"
          ? (JSON.parse(config.data) as unknown)
          : config.data,
      // Absent header reads as undefined; normalise so tests can assert it.
      authorization:
        (config.headers.get("Authorization") as string | undefined) ?? null,
    });

    const response = {
      data,
      status,
      statusText: "",
      headers: {},
      config,
    } as AxiosResponse;

    if (status >= 400) {
      return Promise.reject(
        Object.assign(new Error("stubbed failure"), {
          isAxiosError: true,
          config,
          response,
        }),
      );
    }

    return Promise.resolve(response);
  };

  apiClient.defaults.adapter = adapter;

  return {
    requests,
    restore: () => {
      // The default adapter is an optional property: restoring "undefined"
      // would not typecheck, so put the client back by removing the override.
      if (original === undefined) {
        delete apiClient.defaults.adapter;
      } else {
        apiClient.defaults.adapter = original;
      }
    },
  };
}
