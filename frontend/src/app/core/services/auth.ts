import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080';

  private _isAuthenticated = signal<boolean>(false);
  isAuthenticated = this._isAuthenticated.asReadonly();

  constructor() {
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/api/login`,
        { email, password },
        { withCredentials: true }
      )
    );

    this._isAuthenticated.set(true);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/api/register`,
        { username, email, password },
        { withCredentials: true }
      )
    );
    this._isAuthenticated.set(true);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/api/logout`,
          {},
          { withCredentials: true }
        )
      );
    } finally {
      this._isAuthenticated.set(false);
    }
  }


  getCsrfToken(): string | null {
    const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
    return match ? match[2] : null;
  }
}