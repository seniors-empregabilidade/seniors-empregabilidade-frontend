const ACCESS_TOKEN_KEY = "seniors.access-token";

// Tab-scoped on purpose. The access token lives for fifteen minutes and there is
// no refresh endpoint yet, so persisting it beyond the browsing session would
// widen the exposure window without buying a usable session back.
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

export function clearSession(): void {
  try {
    accessStorage()?.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Nothing kept, nothing to clear.
  }
}
