import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tenants } from './tenants';
import { TenantsService } from './tenants.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

describe('Tenants Component', () => {
  let component: Tenants;
  let fixture: ComponentFixture<Tenants>;
  let tenantsService: any;
  let dialogSpy: any;
  let snackBarSpy: any;

  beforeEach(async () => {
    tenantsService = {
      getCustomers: vi.fn().mockReturnValue(of([])),
      createCustomer: vi.fn().mockReturnValue(of({})),
      updateCustomer: vi.fn().mockReturnValue(of({})),
      deleteCustomer: vi.fn().mockReturnValue(of({}))
    };

    dialogSpy = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(null)
      })
    };

    snackBarSpy = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Tenants],
      providers: [
        provideRouter([]), // ✅ FIX
        { provide: TenantsService, useValue: tenantsService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tenants);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    fixture.detectChanges();
    expect(tenantsService.getCustomers).toHaveBeenCalled();
  });

  it('should toggle between table and grid view', () => {
    component.toggleView('grid');
    expect(component.viewMode).toBe('grid');

    component.toggleView('table');
    expect(component.viewMode).toBe('table');
  });
});