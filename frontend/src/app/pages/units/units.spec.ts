import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Units } from './units';
import { UnitsService } from './units.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
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
  let dialogSpy: any;
  let snackBarSpy: any;

  beforeEach(async () => {
    unitsService = {
      getUnits: vi.fn().mockReturnValue(of([])),
      createUnit: vi.fn().mockReturnValue(of({})),
      updateUnit: vi.fn().mockReturnValue(of({})),
      deleteUnit: vi.fn().mockReturnValue(of({}))
    };

    dialogSpy = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) })
    };

    snackBarSpy = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        provideRouter([]),
        { provide: UnitsService, useValue: unitsService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;
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
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load units', 'Close', { duration: 5000 });
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
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to delete unit', 'Close', { duration: 5000 });
  });

  it('should open dialog for creating a new unit', () => {
    component.openDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should call createUnit when dialog returns data without an existing unit', () => {
    const formResult = { unit_number: 'B2', size_type: 'Medium', price: 100, length: 10, width: 10, height: 10 };
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog();

    expect(unitsService.createUnit).toHaveBeenCalledWith(formResult);
  });

  it('should call updateUnit when dialog returns data for an existing unit', () => {
    const formResult = { unit_number: 'A1', size_type: 'Large', price: 150, length: 10, width: 10, height: 10 };
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog(mockUnit);

    expect(unitsService.updateUnit).toHaveBeenCalledWith(mockUnit.UnitNumber, formResult);
  });

  it('should show snackbar on create error', () => {
    dialogSpy.open.mockReturnValue({ afterClosed: () => of({ unit_number: 'X1' }) });
    unitsService.createUnit.mockReturnValue(throwError(() => ({ status: 409 })));

    component.openDialog();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to create unit. Unit number may already exist.',
      'Close',
      { duration: 6000 }
    );
  });

  it('should not call createUnit when dialog is cancelled', () => {
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(null) });
    component.openDialog();
    expect(unitsService.createUnit).not.toHaveBeenCalled();
  });
});