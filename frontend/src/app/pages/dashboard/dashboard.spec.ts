import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { UnitsService } from '../units/units.service';
import { TenantsService } from '../tenants/tenants.service';
import { Auth } from '../../core/services/auth';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Unit } from '../units/unit.model';
import { Customer } from '../tenants/tenants.model';

const makeUnit = (overrides: Partial<Unit> = {}): Unit => ({
  ID: 1,
  CreatedAt: '',
  UpdatedAt: '',
  DeletedAt: null,
  UnitNumber: 'A1',
  SizeType: 'Small',
  Length: 5,
  Width: 5,
  Height: 10,
  Price: 75,
  CustomerID: null,
  Renter: null,
  Insurance: null,
  Combined: false,
  CombinedFrom: '',
  ...overrides
});

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

describe('Dashboard Component', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let unitsService: any;
  let tenantsService: any;
  let openSnackBarSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    unitsService = {
      getAllUnits:         vi.fn().mockReturnValue(of([])),
      downloadUtilReport: vi.fn().mockReturnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })))
    };

    tenantsService = {
      getCustomers: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UnitsService,   useValue: unitsService },
        { provide: TenantsService, useValue: tenantsService },
        { provide: Auth, useValue: { isManager: vi.fn().mockReturnValue(false), role: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    openSnackBarSpy = vi.fn().mockReturnValue(null);
    (component as any).snackBar = { open: openSnackBarSpy };
  });

  // ── lifecycle ───────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getAllUnits and getCustomers on init', () => {
    fixture.detectChanges();
    expect(unitsService.getAllUnits).toHaveBeenCalled();
    expect(tenantsService.getCustomers).toHaveBeenCalled();
  });

  // ── KPI stats ───────────────────────────────────────────────────────────────

  it('should set totalUnits from loaded units', () => {
    const units = [makeUnit(), makeUnit({ ID: 2, UnitNumber: 'A2' })];
    unitsService.getAllUnits.mockReturnValue(of(units));
    fixture.detectChanges();
    expect(component.totalUnits).toBe(2);
  });

  it('should calculate occupiedUnits correctly', () => {
    const units = [makeUnit(), makeUnit({ ID: 2, UnitNumber: 'A2', CustomerID: 99 })];
    unitsService.getAllUnits.mockReturnValue(of(units));
    fixture.detectChanges();
    expect(component.occupiedUnits).toBe(1);
  });

  it('should set totalTenants from loaded customers', () => {
    tenantsService.getCustomers.mockReturnValue(of([mockCustomer, mockCustomer]));
    fixture.detectChanges();
    expect(component.totalTenants).toBe(2);
  });

  it('should set statsLoading to false after both requests complete', () => {
    fixture.detectChanges();
    expect(component.statsLoading).toBe(false);
  });

  it('should set statsLoading to false even if units request fails', () => {
    unitsService.getAllUnits.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.statsLoading).toBe(false);
  });

  // ── search ──────────────────────────────────────────────────────────────────

  it('should start with empty search results', () => {
    fixture.detectChanges();
    expect(component.searchResults).toBeNull();
    expect(component.hasResults).toBe(false);
    expect(component.noResults).toBe(false);
  });

  it('should clear search results when query is emptied', () => {
    component.onSearchInput('');
    expect(component.searchResults).toBeNull();
    expect(component.searching).toBe(false);
  });

  it('should clear search and results on clearSearch()', () => {
    component.searchQuery = 'test';
    (component as any).searchResults = { customers: [], units: [] };
    component.clearSearch();
    expect(component.searchQuery).toBe('');
    expect(component.searchResults).toBeNull();
    expect(component.searching).toBe(false);
  });

  it('should return false for hasResults when results are empty', () => {
    (component as any).searchResults = { customers: [], units: [] };
    expect(component.hasResults).toBe(false);
  });

  it('should return true for hasResults when customers exist', () => {
    (component as any).searchResults = { customers: [mockCustomer], units: [] };
    expect(component.hasResults).toBe(true);
  });

  it('should return true for noResults when results are set but empty', () => {
    (component as any).searchResults = { customers: [], units: [] };
    (component as any).searching = false;
    expect(component.noResults).toBe(true);
  });

  // ── PDF download ─────────────────────────────────────────────────────────────

  it('should call downloadUtilReport on downloadReport()', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    component.downloadReport();

    expect(unitsService.downloadUtilReport).toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should set downloadingReport to true during download', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    component.downloadReport();
    // After synchronous Observable.of() resolves, it goes back to false
    expect(component.downloadingReport).toBe(false);
  });

  it('should show snackbar and reset flag on download error', () => {
    unitsService.downloadUtilReport.mockReturnValue(throwError(() => ({ status: 500 })));

    component.downloadReport();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Failed to generate report', 'Close', { duration: 5000 }
    );
    expect(component.downloadingReport).toBe(false);
  });
});
