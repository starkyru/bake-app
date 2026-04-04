interface JwtPayload {
  sub?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  exp?: number;
  [key: string]: unknown;
}

/** Decode JWT payload without verification (for frontend display/permission checks only). */
export function decodePayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

/** Check if a JWT token is expired. */
export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/** Get the permissions array from a JWT token. */
export function getPermissions(token: string): string[] {
  const payload = decodePayload(token);
  return payload?.permissions ?? [];
}

/** Check if a token grants a specific permission. Wildcard '*' passes all checks. */
export function hasPermission(token: string, permission: string): boolean {
  const perms = getPermissions(token);
  return perms.includes('*') || perms.includes(permission);
}

/** Check if a token grants ALL of the specified permissions. */
export function hasAllPermissions(token: string, ...permissions: string[]): boolean {
  const perms = getPermissions(token);
  if (perms.includes('*')) return true;
  return permissions.every((p) => perms.includes(p));
}

/** Get the display name from a JWT token. */
export function getUserName(token: string): string {
  const payload = decodePayload(token);
  return payload?.name ?? '';
}

/** Get the role from a JWT token. */
export function getUserRole(token: string): string {
  const payload = decodePayload(token);
  return payload?.role ?? '';
}

/** Get the user ID (sub claim) from a JWT token. */
export function getUserId(token: string): string {
  const payload = decodePayload(token);
  return payload?.sub ?? '';
}

/** Get the email from a JWT token. */
export function getUserEmail(token: string): string {
  const payload = decodePayload(token);
  return payload?.email ?? '';
}
