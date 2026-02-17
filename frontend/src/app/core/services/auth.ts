import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080';

  /* ===============================
      LOGIN
  =============================== */
  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(
        `${this.apiUrl}/api/login`,
        { email, password },
        { withCredentials: true }
      )
    );

    this.setToken(res.token);
  }

  /* ===============================
      REGISTER
  =============================== */
  async register(username: string, email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(
        `${this.apiUrl}/api/register`,
        { username, email, password },
        { withCredentials: true }
      )
    );

    this.setToken(res.token);
  }

  /* ===============================
      TOKEN HANDLING (Cookie)
  =============================== */

  private setToken(token: string) {
    // Store token in cookie (1 day expiry)
    document.cookie = `jwt=${token}; path=/; max-age=86400; SameSite=Lax`;
  }

  getToken(): string | null {
    const match = document.cookie.match(/(^| )jwt=([^;]+)/);
    return match ? match[2] : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    // Remove cookie
    document.cookie = 'jwt=; path=/; max-age=0;';
  }
}
