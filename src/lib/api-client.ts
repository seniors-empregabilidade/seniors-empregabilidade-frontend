import axios from "axios";

import { env } from "@/config/env";
import { toApiError } from "@/lib/api-error";
import { readAccessToken } from "@/lib/session-storage";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
