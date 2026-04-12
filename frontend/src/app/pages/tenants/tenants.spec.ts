import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tenants } from './tenants';
import { TenantsService } from './tenants.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { Customer } from './tenants.model';

const mockCustomer: Customer = {
  ID: 1,
  CreatedAt: '',
  UpdatedAt: '',
  DeletedAt: null,
  FirstName: 'Jane',
  LastName: 'Doe',
  Email: 'jane@example.com',
  Phone: '555-0100',
  Address: '1 Main St'
};

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
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) })
    };

    snackBarSpy = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Tenants],
      providers: [
        provideRouter([]),
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

  it('should populate customers after successful load', () => {
    tenantsService.getCustomers.mockReturnValue(of([mockCustomer]));
    fixture.detectChanges();
    expect(component.customers).toEqual([mockCustomer]);
    expect(component.loading).toBe(false);
  });

  it('should show snackbar on load error', () => {
    tenantsService.getCustomers.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load customers', 'Close', { duration: 5000 });
    expect(component.loading).toBe(false);
  });

  it('should toggle between table and grid view', () => {
    component.toggleView('grid');
    expect(component.viewMode).toBe('grid');

    component.toggleView('table');
    expect(component.viewMode).toBe('table');
  });

  it('should open dialog for creating a new customer', () => {
    component.openDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should call createCustomer when dialog returns data without an existing customer', () => {
    const formResult = { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: '555', address: '1 St' };
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog();

    expect(tenantsService.createCustomer).toHaveBeenCalledWith(formResult);
  });

  it('should call updateCustomer when dialog returns data for an existing customer', () => {
    const formResult = { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '555', address: '1 St' };
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog(mockCustomer);

    expect(tenantsService.updateCustomer).toHaveBeenCalledWith(mockCustomer.ID, formResult);
  });

  it('should show snackbar on create error', () => {
    dialogSpy.open.mockReturnValue({ afterClosed: () => of({ first_name: 'Jane' }) });
    tenantsService.createCustomer.mockReturnValue(throwError(() => ({ status: 500 })));

    component.openDialog();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to create customer', 'Close', { duration: 5000 });
  });

  it('should call deleteCustomer and reload on success', () => {
    component.deleteCustomer(1);
    expect(tenantsService.deleteCustomer).toHaveBeenCalledWith(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Customer deleted successfully', 'Close', { duration: 3000 });
  });

  it('should show snackbar on delete error', () => {
    tenantsService.deleteCustomer.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteCustomer(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to delete customer', 'Close', { duration: 5000 });
  });

  it('should not call createCustomer when dialog is cancelled', () => {
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(null) });
    component.openDialog();
    expect(tenantsService.createCustomer).not.toHaveBeenCalled();
  });
});