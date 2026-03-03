import { Injectable, APP_INITIALIZER, Provider } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Shared cookie name used across all *.bake.ilia.to subdomains. */
const TOKEN_COOKIE = 'bake_token';

function getCookieDomain(): string | null {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return null; // no domain attr needed for localhost
  }
  // e.g. "admin.bake.ilia.to" → ".bake.ilia.to"
  const parts = host.split('.');
  if (parts.length >= 3) {
    return '.' + parts.slice(-3).join('.');
  }
  return '.' + host;
}

function setSharedCookie(token: string): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}${domainAttr}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
}

function getSharedCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteSharedCookie(): void {
  const domain = getCookieDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${TOKEN_COOKIE}=${domainAttr}; path=/; max-age=0; SameSite=Lax${secureAttr}`;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/v1/auth/login', { email, password });
  }

  /** Store the JWT in both localStorage (app use) and a shared cookie (cross-subdomain). */
  setToken(token: string): void {
    localStorage.setItem('token', token);
    setSharedCookie(token);
  }

  logout(): void {
    localStorage.removeItem('token');
    deleteSharedCookie();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

/**
 * APP_INITIALIZER that syncs the shared cookie into localStorage on startup.
 * If a token exists in the cookie but not in localStorage, it copies it over.
 * This enables cross-subdomain SSO — log in once at the hub, access all sub-apps.
 */
export function provideAuthTokenPassthrough(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: () => () => {
      const localToken = localStorage.getItem('token');
      const cookieToken = getSharedCookie();

      if (!localToken && cookieToken) {
        localStorage.setItem('token', cookieToken);
      } else if (localToken && !cookieToken) {
        setSharedCookie(localToken);
      }
    },
  };
}
