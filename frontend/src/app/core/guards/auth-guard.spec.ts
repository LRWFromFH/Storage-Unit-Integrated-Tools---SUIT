import { TestBed } from '@angular/core/testing';
import { CanActivateFn, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth-guard';
import { Auth } from '../services/auth';
import { vi } from 'vitest';

describe('authGuard', () => {
  const route  = {} as ActivatedRouteSnapshot;
  const stateOf = (url: string) => ({ url } as RouterStateSnapshot);

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authSpy: any;

  beforeEach(() => {
    authSpy = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      role:            vi.fn().mockReturnValue(''),
      isManager:       vi.fn().mockReturnValue(false),
      fetchUserRole:   vi.fn().mockResolvedValue(undefined),
      setAuthenticated: vi.fn(),
      getCsrfToken:    vi.fn().mockReturnValue(null)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authSpy }
      ]
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should return true immediately when already authenticated with a role', () => {
    authSpy.isAuthenticated.mockReturnValue(true);
    authSpy.role.mockReturnValue('employee');

    const result = executeGuard(route, stateOf('/dashboard'));
    expect(result).toBe(true);
  });

  it('should redirect to /login when session check fails (unauthenticated)', async () => {
    authSpy.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard(route, stateOf('/dashboard')));

    // It returns an Observable that will eventually resolve to a UrlTree
    const { firstValueFrom } = await import('rxjs');
    const { HttpTestingController } = await import('@angular/common/http/testing');
    const httpMock = TestBed.inject(HttpTestingController);

    const obs = result as any;
    const promise = firstValueFrom(obs);
    httpMock.expectOne('http://localhost:8080/api/session').flush(
      { error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }
    );

    const urlTree: any = await promise;
    expect(String(urlTree)).toContain('/login');
    httpMock.verify();
  });
});
