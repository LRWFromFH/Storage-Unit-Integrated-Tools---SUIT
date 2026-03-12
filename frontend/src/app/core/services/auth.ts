import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
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
  try {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/api/login`,
        { email, password },
        { withCredentials: true }
      )
    );

    this._isAuthenticated.set(true);

  } catch (err) {
    // Wrap 401 errors in a structured object
    if (err instanceof HttpErrorResponse && err.status === 401) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const status = (err as { status?: number })?.status ?? 0;
    throw { status, message: 'Something went wrong' };
  }
}

  async register(username: string, email: string, password: string): Promise<void> {
  try {
    await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/api/register`,
        { username, email, password },
        { withCredentials: true }
      )
    );
    this._isAuthenticated.set(true);

  } catch (err) {
    if (err instanceof HttpErrorResponse && err.status === 400) {
      throw { status: 400, message: 'Invalid registration data' };
    }
    const status = (err as { status?: number })?.status ?? 0;
    throw { status, message: 'Something went wrong' };
  }
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