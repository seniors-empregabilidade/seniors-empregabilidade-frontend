import axios, { type InternalAxiosRequestConfig } from "axios";
import { z } from "zod";

import { env } from "@/config/env";
import { toApiError } from "@/lib/api-error";
import {
  clearSession,
  readAccessToken,
  readRefreshToken,
  writeAccessToken,
  writeRefreshToken,
} from "@/lib/session-storage";

// Shared code cannot import the auth feature, so only the two fields it needs.
const refreshedSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).nullable(),
});

declare module "axios" {
  interface AxiosRequestConfig {
    /** Set on the refresh call and on the one retry, so neither refreshes again. */
    skipRefresh?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
});

const apiOrigin = new URL(env.VITE_API_URL, window.location.origin).origin;

// The API authorises with a bearer access token rather than a session cookie,
// so every request has to carry it explicitly. Read on each request: the token
// changes at sign-in and disappears at sign-out.
//
// The token goes only to the configured API origin. This client also reaches
// third parties such as the postal code provider, and those must never receive
// a credential: the header is removed rather than left to the caller to avoid.
apiClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken();
  const target = new URL(apiClient.getUri(config), window.location.origin)
    .origin;

  if (accessToken && target === apiOrigin) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    config.headers.delete("Authorization");
  }

  return config;
});

// One refresh serves every request that expires together.
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = readRefreshToken();
  const accessToken = readAccessToken();
  if (!refreshToken || !accessToken) return false;

  try {
    const response = await apiClient.post<unknown>(
      "/auth/refresh",
      { refresh_token: refreshToken, access_token: accessToken },
      { skipRefresh: true },
    );
    const session = refreshedSchema.parse(response.data);
    writeAccessToken(session.access_token);
    if (session.refresh_token) writeRefreshToken(session.refresh_token);
    return true;
  } catch (error) {
    // Only a refused token ends the session; network and server failures can retry.
    const status = toApiError(error).status;
    if (status === 401 || status === 403) clearSession();
    return false;
  }
}

async function retryAfterRefresh(
  config: InternalAxiosRequestConfig,
): Promise<boolean> {
  const sentWith = config.headers.get("Authorization");
  if (sentWith !== `Bearer ${readAccessToken() ?? ""}`) return true;
  refreshing ??= refreshSession().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? error.config : undefined;
    if (
      config &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !config.skipRefresh &&
      // Wrong credentials are not an expired session.
      config.url !== "/auth/login" &&
      config.headers.get("Authorization") &&
      (await retryAfterRefresh(config))
    ) {
      return apiClient.request({ ...config, skipRefresh: true });
    }
    throw toApiError(error);
  },
);
