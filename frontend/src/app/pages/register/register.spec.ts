import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { Auth } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: any;
  let httpSpy: any;

  const employeeList = [
    { ID: 1, smid: 'emp01', email: 'emp01@example.com', role: 'employee' },
    { ID: 2, smid: 'mgr01', email: 'mgr01@example.com', role: 'manager'  }
  ];

  beforeEach(async () => {
    authService = {
      registerEmployee: vi.fn().mockResolvedValue(42)
    };

    httpSpy = {
      get:  vi.fn().mockReturnValue(of({ employees: employeeList })),
      post: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Auth,       useValue: authService },
        { provide: HttpClient, useValue: httpSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
  });

  // ── lifecycle ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    fixture.detectChanges();
    const url: string = httpSpy.get.mock.calls[0]?.[0] ?? '';
    expect(url).toContain('/employees');
  });

  it('should populate employees list after successful load', () => {
    fixture.detectChanges();
    expect(component.employees).toEqual(employeeList);
    expect(component.employeesLoading).toBe(false);
  });

  it('should set employeesLoading to false on HTTP error', () => {
    httpSpy.get.mockReturnValue(throwError(() => ({ status: 403 })));
    fixture.detectChanges();
    expect(component.employeesLoading).toBe(false);
  });

  it('should handle null employees array from API', () => {
    httpSpy.get.mockReturnValue(of({ employees: null }));
    fixture.detectChanges();
    expect(component.employees).toEqual([]);
    expect(component.employeesLoading).toBe(false);
  });

  // ── form defaults ─────────────────────────────────────────────────────────

  it('should have an invalid form when fields are empty', () => {
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);
  });

  it('should have a valid form with correct input', () => {
    fixture.detectChanges();
    component.form.setValue({ username: 'emp001', email: 'emp@example.com', password: 'secret123' });
    expect(component.form.valid).toBe(true);
  });

  it('roleForm default role should be employee', () => {
    fixture.detectChanges();
    expect(component.roleForm.get('role')?.value).toBe('employee');
  });

  // ── register employee ─────────────────────────────────────────────────────

  it('should call registerEmployee on valid form submit', async () => {
    fixture.detectChanges();
    component.form.setValue({ username: 'emp001', email: 'emp@example.com', password: 'secret123' });
    await component.onSubmit();
    expect(authService.registerEmployee).toHaveBeenCalledWith('emp001', 'emp@example.com', 'secret123');
  });

  it('should set successMessage after successful registration', async () => {
    fixture.detectChanges();
    component.form.setValue({ username: 'emp001', email: 'emp@example.com', password: 'secret123' });
    await component.onSubmit();
    expect(component.successMessage).toContain('42');
    expect(component.isLoading).toBe(false);
  });

  it('should refresh employee list after successful registration', async () => {
    fixture.detectChanges();
    const callsBefore = httpSpy.get.mock.calls.length;
    component.form.setValue({ username: 'emp001', email: 'emp@example.com', password: 'secret123' });
    await component.onSubmit();
    expect(httpSpy.get.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('should set errorMessage on registration failure', async () => {
    authService.registerEmployee.mockRejectedValue({ status: 409, message: 'Email or username already exists' });
    fixture.detectChanges();
    component.form.setValue({ username: 'dup', email: 'dup@example.com', password: 'password123' });
    await component.onSubmit();
    expect(component.errorMessage).toBe('Email or username already exists');
    expect(component.isLoading).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    fixture.detectChanges();
    await component.onSubmit();
    expect(authService.registerEmployee).not.toHaveBeenCalled();
  });

  // ── update role ───────────────────────────────────────────────────────────

  it('should call POST /employees/:id/role on valid role form submit', async () => {
    fixture.detectChanges();
    component.roleForm.setValue({ employeeId: '1', role: 'manager' });
    await component.onUpdateRole();
    const url: string = httpSpy.post.mock.calls[0]?.[0] ?? '';
    const body = httpSpy.post.mock.calls[0]?.[1];
    expect(url).toContain('/employees/1/role');
    expect(body).toEqual({ role: 'manager' });
  });

  it('should set roleSuccess after successful role update', async () => {
    fixture.detectChanges();
    component.roleForm.setValue({ employeeId: '1', role: 'manager' });
    await component.onUpdateRole();
    expect(component.roleSuccess).toContain('manager');
    expect(component.roleLoading).toBe(false);
  });

  it('should refresh employee list after successful role update', async () => {
    fixture.detectChanges();
    const callsBefore = httpSpy.get.mock.calls.length;
    component.roleForm.setValue({ employeeId: '1', role: 'manager' });
    await component.onUpdateRole();
    expect(httpSpy.get.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('should set roleError on 404 response', async () => {
    httpSpy.post.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();
    component.roleForm.setValue({ employeeId: '999', role: 'employee' });
    await component.onUpdateRole();
    expect(component.roleError).toContain('not found');
    expect(component.roleLoading).toBe(false);
  });

  it('should set roleError on 403 response', async () => {
    httpSpy.post.mockReturnValue(throwError(() => ({ status: 403 })));
    fixture.detectChanges();
    component.roleForm.setValue({ employeeId: '1', role: 'manager' });
    await component.onUpdateRole();
    expect(component.roleError).toContain('managers');
    expect(component.roleLoading).toBe(false);
  });

  it('should not submit role form when invalid', async () => {
    fixture.detectChanges();
    component.roleForm.setValue({ employeeId: '', role: 'employee' });
    await component.onUpdateRole();
    expect(httpSpy.post).not.toHaveBeenCalled();
  });
});
