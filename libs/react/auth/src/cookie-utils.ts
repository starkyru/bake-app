/** Shared cookie name used across all *.bake.ilia.to subdomains. */
export const TOKEN_COOKIE = 'bake_token';

/**
 * Extracts the shared cookie domain from the current hostname.
 * Returns `.bake.ilia.to` for subdomains, null for localhost.
 */
export function getCookieDomain(): string | null {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  // e.g. "admin.bake.ilia.to" -> ".bake.ilia.to"
  const parts = host.split('.');
  if (parts.length >= 3) {
    return '.' + parts.slice(-3).join('.');
  }
  return '.' + host;
}

/** Sets a shared cookie with 7-day max-age, domain scoping, SameSite=Lax, and Secure for https. */
export function setSharedCookie(token: string): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}${domainAttr}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
}

/** Reads the shared cookie value, or null if not present. */
export function getSharedCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Removes the shared cookie by setting max-age=0. */
export function deleteSharedCookie(): void {
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${TOKEN_COOKIE}=${domainAttr}; path=/; max-age=0; SameSite=Lax${secureAttr}`;
}
