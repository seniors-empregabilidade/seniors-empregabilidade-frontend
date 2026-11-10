/**
 * Absolute http(s) URL safe to open in a new tab.
 *
 * Anything else — a relative path, a script or data URL, or credentials in
 * the authority — is refused. The returned value is the parsed URL, so the
 * link never receives the raw string.
 */
export function safeExternalUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.username !== "" || url.password !== "") {
    return null;
  }

  return url.href;
}
