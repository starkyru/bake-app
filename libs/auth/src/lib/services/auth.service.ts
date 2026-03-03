import { Injectable, APP_INITIALIZER, Provider } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/v1/auth/login', { email, password });
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

/**
 * Checks for a `?token=` query parameter on app startup,
 * stores it in localStorage, and cleans it from the URL.
 * Use in bootstrapApplication providers to enable cross-subdomain auth from the hub.
 */
export function provideAuthTokenPassthrough(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: () => () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        localStorage.setItem('token', token);
        params.delete('token');
        const clean = params.toString();
        const url = window.location.pathname + (clean ? '?' + clean : '') + window.location.hash;
        window.history.replaceState({}, '', url);
      }
    },
  };
}
