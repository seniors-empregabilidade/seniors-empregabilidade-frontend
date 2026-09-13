export const PENDING_EMAIL_KEY = "seniors.pending-verification-email";

export interface PendingEmail {
  email: string;
  resendAvailableAt: number;
}

export function readPendingEmail(): PendingEmail | null {
  try {
    const stored = window.sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object") return null;
    const email: unknown = Reflect.get(value, "email");
    const resendAvailableAt: unknown = Reflect.get(value, "resendAvailableAt");
    if (
      typeof email !== "string" ||
      typeof resendAvailableAt !== "number" ||
      !Number.isFinite(resendAvailableAt)
    )
      return null;
    return { email, resendAvailableAt };
  } catch {
    return null;
  }
}

export function writePendingEmail(email: string, resendAvailableAt = 0): void {
  try {
    window.sessionStorage.setItem(
      PENDING_EMAIL_KEY,
      JSON.stringify({ email, resendAvailableAt }),
    );
  } catch {
    // The current page can continue in memory when storage is unavailable.
  }
}

export function clearPendingEmail(): void {
  try {
    window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // Blocked storage must not prevent confirmation or changing the email.
  }
}
