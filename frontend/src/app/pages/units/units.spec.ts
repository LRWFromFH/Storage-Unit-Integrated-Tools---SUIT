import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Units } from './units';
import { UnitsService } from './units.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Unit } from './unit.model';

const mockUnit: Unit = {
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
  CombinedFrom: ''
};

describe('Units Component', () => {
  let component: Units;
  let fixture: ComponentFixture<Units>;
  let unitsService: any;
  let openDialogSpy: ReturnType<typeof vi.fn>;
  let openSnackBarSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    unitsService = {
      getUnits:     vi.fn().mockReturnValue(of([])),
      createUnit:   vi.fn().mockReturnValue(of({})),
      updateUnit:   vi.fn().mockReturnValue(of({})),
      deleteUnit:   vi.fn().mockReturnValue(of({})),
      combineUnits: vi.fn().mockReturnValue(of({})),
      assignUnit:   vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UnitsService, useValue: unitsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Units);
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

  it('should load units on init', () => {
    fixture.detectChanges();
    expect(unitsService.getUnits).toHaveBeenCalled();
  });

  it('should set units and filteredUnits after successful load', () => {
    unitsService.getUnits.mockReturnValue(of([mockUnit]));
    fixture.detectChanges();
    expect(component.units).toEqual([mockUnit]);
    expect(component.filteredUnits).toEqual([mockUnit]);
    expect(component.loading).toBe(false);
  });

  it('should show snackbar on load error', () => {
    unitsService.getUnits.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to load units', 'Close', { duration: 5000 });
    expect(component.loading).toBe(false);
  });

  it('should toggle between table and grid view', () => {
    component.toggleView('grid');
    expect(component.viewMode).toBe('grid');

    component.toggleView('table');
    expect(component.viewMode).toBe('table');
  });

  it('should call deleteUnit service', () => {
    component.deleteUnit('A1');
    expect(unitsService.deleteUnit).toHaveBeenCalledWith('A1');
  });

  it('should show snackbar on delete error', () => {
    unitsService.deleteUnit.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteUnit('A1');
    expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to delete unit', 'Close', { duration: 5000 });
  });

  it('should open dialog for creating a new unit', () => {
    component.openDialog();
    expect(openDialogSpy).toHaveBeenCalled();
  });

  it('should call createUnit when dialog returns data without an existing unit', () => {
    // Dialog returns Pascal case to match Go struct fields (fixed in unit-dialog.ts)
    const formResult = { UnitNumber: 'B2', SizeType: 'Medium', Price: 100, Length: 10, Width: 10, Height: 10 };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog();

    expect(unitsService.createUnit).toHaveBeenCalledWith(formResult);
  });

  it('should call updateUnit when dialog returns data for an existing unit', () => {
    const formResult = { UnitNumber: 'A1', SizeType: 'Large', Price: 150, Length: 10, Width: 10, Height: 10 };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog(mockUnit);

    expect(unitsService.updateUnit).toHaveBeenCalledWith(mockUnit.UnitNumber, formResult);
  });

  it('should show snackbar on create error', () => {
    openDialogSpy.mockReturnValue({ afterClosed: () => of({ UnitNumber: 'X1' }) });
    unitsService.createUnit.mockReturnValue(throwError(() => ({ status: 409 })));

    component.openDialog();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Failed to create unit. Unit number may already exist.',
      'Close',
      { duration: 6000 }
    );
  });

  it('should not call createUnit when dialog is cancelled', () => {
    openDialogSpy.mockReturnValue({ afterClosed: () => of(null) });
    component.openDialog();
    expect(unitsService.createUnit).not.toHaveBeenCalled();
  });
});
