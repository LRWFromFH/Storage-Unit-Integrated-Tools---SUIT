import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';
import { Auth } from '../services/auth';
import { vi } from 'vitest';

const makeAuthSpy = (csrfToken: string | null) => ({
  getCsrfToken:    vi.fn().mockReturnValue(csrfToken),
  isAuthenticated: vi.fn().mockReturnValue(true),
  role:            vi.fn().mockReturnValue('employee'),
  isManager:       vi.fn().mockReturnValue(false)
});

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  const setup = (csrfToken: string | null) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: makeAuthSpy(csrfToken) }
      ]
    });
    http   = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  };

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('should be defined', () => {
    setup(null);
    expect(authInterceptor).toBeDefined();
  });

  it('should add withCredentials to every request', () => {
    setup(null);
    client.get('/api/test').subscribe();
    const req = http.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should add X-CSRF-TOKEN header when token is present', () => {
    setup('csrf-abc123');
    client.get('/api/dashboard').subscribe();
    const req = http.expectOne('/api/dashboard');
    expect(req.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-abc123');
    req.flush({});
  });

  it('should NOT add X-CSRF-TOKEN header when token is absent', () => {
    setup(null);
    client.get('/api/dashboard').subscribe();
    const req = http.expectOne('/api/dashboard');
    expect(req.request.headers.has('X-CSRF-TOKEN')).toBe(false);
    req.flush({});
  });

  it('should NOT add X-CSRF-TOKEN header for the login endpoint', () => {
    setup('csrf-abc123');
    client.post('/api/login', {}).subscribe();
    const req = http.expectOne('/api/login');
    expect(req.request.headers.has('X-CSRF-TOKEN')).toBe(false);
    req.flush({});
  });
});
