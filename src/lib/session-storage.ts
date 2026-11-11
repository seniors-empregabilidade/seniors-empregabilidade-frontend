const ACCESS_TOKEN_KEY = "seniors.access-token";
const REFRESH_TOKEN_KEY = "seniors.refresh-token";

// Tab-scoped on purpose. The access token lives for fifteen minutes and the
// refresh token renews it silently, so persisting either beyond the browsing
// session would widen the exposure window without a session worth keeping.
function accessStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    // Private mode and blocked site data must not break the application.
    return null;
  }
}

export function readAccessToken(): string | null {
  try {
    return accessStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } catch {
    // An unreadable store is indistinguishable from a signed-out visitor.
    return null;
  }
}

export function writeAccessToken(token: string): void {
  try {
    accessStorage()?.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // The session simply will not survive a reload.
  }
}

export function readRefreshToken(): string | null {
  try {
    return accessStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeRefreshToken(token: string): void {
  try {
    accessStorage()?.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // The session simply will not survive a reload.
  }
}

export function clearSession(): void {
  try {
    accessStorage()?.removeItem(ACCESS_TOKEN_KEY);
    accessStorage()?.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing kept, nothing to clear.
  }
}
