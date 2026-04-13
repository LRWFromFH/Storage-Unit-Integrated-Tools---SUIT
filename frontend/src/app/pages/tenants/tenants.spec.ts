import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tenants } from './tenants';
import { TenantsService } from './tenants.service';
import { UnitsService } from '../units/units.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
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
  let unitsService: any;
  let openDialogSpy: ReturnType<typeof vi.fn>;
  let openSnackBarSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tenantsService = {
      getCustomers:     vi.fn().mockReturnValue(of([])),
      createCustomer:   vi.fn().mockReturnValue(of({})),
      updateCustomer:   vi.fn().mockReturnValue(of({})),
      deleteCustomer:   vi.fn().mockReturnValue(of({})),
      getCustomerUnits: vi.fn().mockReturnValue(of([]))
    };

    unitsService = {
      getUnits:   vi.fn().mockReturnValue(of([])),
      assignUnit: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Tenants],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: TenantsService, useValue: tenantsService },
        { provide: UnitsService,   useValue: unitsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tenants);
    component = fixture.componentInstance;

    // Replace the private injected services directly on the component instance.
    // TestBed.inject(MatDialog) returns the root-injector instance, which differs
    // from the one the standalone component gets from its own module injector.
    openDialogSpy   = vi.fn().mockReturnValue({ afterClosed: () => of(null) });
    openSnackBarSpy = vi.fn().mockReturnValue(null);
    (component as any).dialog   = { open: openDialogSpy };
    (component as any).snackBar = { open: openSnackBarSpy };
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
    expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to load customers', 'Close', { duration: 5000 });
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
    expect(openDialogSpy).toHaveBeenCalled();
  });

  it('should call createCustomer when dialog returns data without an existing customer', () => {
    // Dialog returns Pascal case to match Go struct fields (fixed in tenant-dialog.ts)
    const formResult = { FirstName: 'Jane', LastName: 'Doe', Email: 'jane@example.com', Phone: '555', Address: '1 St' };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog();

    expect(tenantsService.createCustomer).toHaveBeenCalledWith(formResult);
  });

  it('should call updateCustomer when dialog returns data for an existing customer', () => {
    const formResult = { FirstName: 'Jane', LastName: 'Smith', Email: 'jane@example.com', Phone: '555', Address: '1 St' };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog(mockCustomer);

    expect(tenantsService.updateCustomer).toHaveBeenCalledWith(mockCustomer.ID, formResult);
  });

  it('should show snackbar on create error', () => {
    openDialogSpy.mockReturnValue({ afterClosed: () => of({ FirstName: 'Jane' }) });
    tenantsService.createCustomer.mockReturnValue(throwError(() => ({ status: 500 })));

    component.openDialog();

    expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to create customer', 'Close', { duration: 5000 });
  });

  it('should call deleteCustomer and reload on success', () => {
    component.deleteCustomer(1);
    expect(tenantsService.deleteCustomer).toHaveBeenCalledWith(1);
    expect(openSnackBarSpy).toHaveBeenCalledWith('Customer deleted successfully', 'Close', { duration: 3000 });
  });

  it('should show snackbar on delete error', () => {
    tenantsService.deleteCustomer.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteCustomer(1);
    expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to delete customer', 'Close', { duration: 5000 });
  });

  it('should not call createCustomer when dialog is cancelled', () => {
    openDialogSpy.mockReturnValue({ afterClosed: () => of(null) });
    component.openDialog();
    expect(tenantsService.createCustomer).not.toHaveBeenCalled();
  });
});
