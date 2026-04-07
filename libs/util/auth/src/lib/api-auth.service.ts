import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

const JWT_KEY = 'storee_jwt';

interface AuthResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(localStorage.getItem(JWT_KEY));

  readonly isLoggedIn = computed(() => {
    const token = this._token();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  get token(): string | null {
    return this._token();
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/login', { email, password }),
    );
    this.storeToken(res.accessToken);
  }

  async register(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>('/api/auth/register', { email, password }),
    );
    this.storeToken(res.accessToken);
  }

  logout(): void {
    localStorage.removeItem(JWT_KEY);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  private storeToken(token: string): void {
    localStorage.setItem(JWT_KEY, token);
    this._token.set(token);
  }
}
