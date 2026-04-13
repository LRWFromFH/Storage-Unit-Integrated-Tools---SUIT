import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export type UserRole = 'manager' | 'employee' | '';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080';

  private _isAuthenticated = signal<boolean>(false);
  private _role = signal<UserRole>('');

  isAuthenticated = this._isAuthenticated.asReadonly();
  role = this._role.asReadonly();
  isManager = computed(() => this._role() === 'manager');

  async login(email: string, password: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/api/login`, { email, password }, { withCredentials: true })
      );
      this._isAuthenticated.set(true);
      await this.fetchUserRole();
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        throw { status: 401, message: 'Invalid email or password' };
      }
      const status = (err as { status?: number })?.status ?? 0;
      throw { status, message: 'Something went wrong' };
    }
  }

  /** Called by managers to register a new employee account. Returns the new employee's database ID. */
  async registerEmployee(username: string, email: string, password: string): Promise<number> {
    try {
      const resp = await firstValueFrom(
        this.http.post<{ user: { ID: number } }>(`${this.apiUrl}/api/register`, { username, email, password }, { withCredentials: true })
      );
      return resp.user.ID;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        throw { status: 403, message: 'Only managers can register new employees' };
      }
      if (err instanceof HttpErrorResponse && err.status === 409) {
        throw { status: 409, message: 'Email or username already exists' };
      }
      const status = (err as { status?: number })?.status ?? 0;
      throw { status, message: 'Registration failed. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/api/logout`, {}, { withCredentials: true })
      );
    } finally {
      this._isAuthenticated.set(false);
      this._role.set('');
    }
  }

  /** Fetches the current user's role from the dashboard endpoint and stores it. */
  async fetchUserRole(): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.http.get<{ role: string; employee_id: number }>(
          `${this.apiUrl}/api/dashboard`,
          { withCredentials: true }
        )
      );
      this._role.set((resp.role as UserRole) || '');
    } catch {
      this._role.set('');
    }
  }

  setAuthenticated(value: boolean) {
    this._isAuthenticated.set(value);
  }

  getCsrfToken(): string | null {
    const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
    return match ? match[2] : null;
  }
}