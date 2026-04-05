interface CustomerJwtPayload {
  sub?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  isGuest?: boolean;
  exp?: number;
  [key: string]: unknown;
}

/** Decode a customer JWT payload without verification (frontend display only). */
export function decodeCustomerToken(token: string): CustomerJwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as CustomerJwtPayload;
  } catch {
    return null;
  }
}

/** Check if a customer JWT token is expired. */
export function isCustomerTokenExpired(token: string): boolean {
  const payload = decodeCustomerToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
