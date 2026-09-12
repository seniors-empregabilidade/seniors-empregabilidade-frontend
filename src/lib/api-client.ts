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

// The API authorises with a bearer access token rather than a session cookie,
// so every request has to carry it explicitly. Read on each request: the token
// changes at sign-in and disappears at sign-out.
apiClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
