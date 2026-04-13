import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from './auth';

describe('Auth Service', () => {
  let service: Auth;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(Auth);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush any stray requests so verify() never throws an "open requests" error
    // that would prevent subsequent beforeEach calls from working.
    http.match(() => true).forEach(req => req.flush({}));
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated with no role', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBe('');
    expect(service.isManager()).toBe(false);
  });

  // ── login ──────────────────────────────────────────────────────────────────

  it('should set authenticated and fetch role on successful login', async () => {
    const loginPromise = service.login('admin@example.com', 'password');

    // Flush the login POST
    http.expectOne('http://localhost:8080/api/login').flush({});

    // Yield to the microtask queue so the `await firstValueFrom(login)` inside
    // Auth.login() can settle and then call fetchUserRole(), which enqueues the
    // dashboard GET.
    await Promise.resolve();

    // Now the dashboard request is in flight — flush it
    http.expectOne('http://localhost:8080/api/dashboard').flush({ role: 'manager', employee_id: 1 });

    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('manager');
    expect(service.isManager()).toBe(true);
  });

  it('should throw with status 401 on bad credentials', async () => {
    const loginPromise = service.login('bad@example.com', 'wrong');

    http.expectOne('http://localhost:8080/api/login').flush(
      { error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }
    );

    let caught: any;
    try { await loginPromise; } catch (e) { caught = e; }
    expect(caught?.status).toBe(401);
    expect(service.isAuthenticated()).toBe(false);
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  it('should clear auth state on logout', async () => {
    service.setAuthenticated(true);

    const logoutPromise = service.logout();
    http.expectOne('http://localhost:8080/api/logout').flush({});
    await logoutPromise;

    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBe('');
  });

  it('should clear auth state even if logout request fails', async () => {
    service.setAuthenticated(true);

    const logoutPromise = service.logout();
    http.expectOne('http://localhost:8080/api/logout').flush(
      { error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' }
    );
    await logoutPromise;

    expect(service.isAuthenticated()).toBe(false);
  });

  // ── registerEmployee ───────────────────────────────────────────────────────

  it('should return the new employee ID on successful registration', async () => {
    const registerPromise = service.registerEmployee('emp001', 'emp@example.com', 'pass1234');

    http.expectOne('http://localhost:8080/api/register').flush({ user: { ID: 7 } });

    const id = await registerPromise;
    expect(id).toBe(7);
  });

  it('should throw 403 when a non-manager tries to register', async () => {
    const registerPromise = service.registerEmployee('emp001', 'emp@example.com', 'pass1234');
    http.expectOne('http://localhost:8080/api/register').flush(
      { error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' }
    );
    let caught: any;
    try { await registerPromise; } catch (e) { caught = e; }
    expect(caught?.status).toBe(403);
  });

  it('should throw 409 on duplicate email/username', async () => {
    const registerPromise = service.registerEmployee('dup', 'dup@example.com', 'pass1234');
    http.expectOne('http://localhost:8080/api/register').flush(
      { error: 'Conflict' }, { status: 409, statusText: 'Conflict' }
    );
    let caught: any;
    try { await registerPromise; } catch (e) { caught = e; }
    expect(caught?.status).toBe(409);
  });

  // ── fetchUserRole ──────────────────────────────────────────────────────────

  it('should set role from dashboard response', async () => {
    const p = service.fetchUserRole();
    http.expectOne('http://localhost:8080/api/dashboard').flush({ role: 'employee', employee_id: 3 });
    await p;
    expect(service.role()).toBe('employee');
    expect(service.isManager()).toBe(false);
  });

  it('should set empty role when dashboard request fails', async () => {
    const p = service.fetchUserRole();
    http.expectOne('http://localhost:8080/api/dashboard').flush(
      { error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }
    );
    await p;
    expect(service.role()).toBe('');
  });
});
