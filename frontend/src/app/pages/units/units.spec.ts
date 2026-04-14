import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Units } from './units';
import { UnitsService } from './units.service';
import { Auth } from '../../core/services/auth';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Unit } from './unit.model';

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

const mockUnit     = makeUnit();
const occupiedUnit = makeUnit({ ID: 2, UnitNumber: 'B1', CustomerID: 99 });

describe('Units Component', () => {
  let component: Units;
  let fixture: ComponentFixture<Units>;
  let unitsService: any;
  let authService: any;
  let openDialogSpy: ReturnType<typeof vi.fn>;
  let openSnackBarSpy: ReturnType<typeof vi.fn>;

  const configureTestBed = async () => {
    authService = {
      isManager: vi.fn(),
      role: vi.fn()
    };

    unitsService = {
      getUnits: vi.fn(),
      getAllUnits: vi.fn().mockReturnValue(of([])),
      createUnit: vi.fn().mockReturnValue(of({})),
      updateUnit: vi.fn().mockReturnValue(of({})),
      deleteUnit: vi.fn().mockReturnValue(of({})),
      combineUnits: vi.fn().mockReturnValue(of({})),
      assignUnit: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UnitsService, useValue: unitsService },
        { provide: Auth, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;

    openDialogSpy   = vi.fn().mockReturnValue({ afterClosed: () => of(null) });
    openSnackBarSpy = vi.fn().mockReturnValue(null);

    (component as any).dialog   = { open: openDialogSpy };
    (component as any).snackBar = { open: openSnackBarSpy };
  };

  beforeEach(async () => configureTestBed());

  
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getAllUnits on init', () => {
    fixture.detectChanges();
    expect(unitsService.getAllUnits).toHaveBeenCalled();
  });

  it('should set units and filteredUnits after successful load', () => {
    unitsService.getAllUnits.mockReturnValue(of([mockUnit]));
    fixture.detectChanges();

    expect(component.units).toEqual([mockUnit]);
    expect(component.filteredUnits).toEqual([mockUnit]);
    expect(component.loading).toBe(false);
  });

  it('should show snackbar on load error', () => {
    unitsService.getAllUnits.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Failed to load units',
      'Close',
      { duration: 5000 }
    );
    expect(component.loading).toBe(false);
  });

  
  it('should toggle between table and grid view', () => {
    component.toggleView('grid');
    expect(component.viewMode).toBe('grid');

    component.toggleView('table');
    expect(component.viewMode).toBe('table');
  });

  it('should call deleteUnit service on success', () => {
    component.deleteUnit('A1');

    expect(unitsService.deleteUnit).toHaveBeenCalledWith('A1');
    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Unit deleted successfully',
      'Close',
      { duration: 3000 }
    );
  });

  it('should show snackbar on delete error', () => {
    unitsService.deleteUnit.mockReturnValue(throwError(() => ({ status: 500 })));

    component.deleteUnit('A1');

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Failed to delete unit',
      'Close',
      { duration: 5000 }
    );
  });

  it('should open dialog for creating a new unit', () => {
    component.openDialog();
    expect(openDialogSpy).toHaveBeenCalled();
  });

  it('should call createUnit when dialog returns data', () => {
    const formResult = { UnitNumber: 'B2' };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog();

    expect(unitsService.createUnit).toHaveBeenCalledWith(formResult);
  });

  it('should call updateUnit when editing', () => {
    const formResult = { UnitNumber: 'A1' };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(formResult) });

    component.openDialog(mockUnit);

    expect(unitsService.updateUnit).toHaveBeenCalledWith('A1', formResult);
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

  
  it('should show snackbar if fewer than 2 available units exist', () => {
    unitsService.getAllUnits.mockReturnValue(of([mockUnit]));
    fixture.detectChanges();

    component.openCombineDialog();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Need at least 2 available units to combine',
      'Close',
      { duration: 4000 }
    );
  });

  it('should open combine dialog when 2+ units exist', () => {
    const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
    unitsService.getAllUnits.mockReturnValue(of([mockUnit, unit2]));
    fixture.detectChanges();

    component.openCombineDialog();

    expect(openDialogSpy).toHaveBeenCalled();
  });

  it('should call combineUnits and delete originals', () => {
    const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
    unitsService.getAllUnits.mockReturnValue(of([mockUnit, unit2]));
    fixture.detectChanges();

    const result = { unit_ids: [1, 2], price: 200 };
    openDialogSpy.mockReturnValue({ afterClosed: () => of(result) });

    component.openCombineDialog();

    expect(unitsService.combineUnits).toHaveBeenCalledWith(result);
    expect(unitsService.deleteUnit).toHaveBeenCalledWith('A1');
    expect(unitsService.deleteUnit).toHaveBeenCalledWith('A2');
  });

  it('should show snackbar on combine error', () => {
    const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
    unitsService.getAllUnits.mockReturnValue(of([mockUnit, unit2]));
    fixture.detectChanges();

    openDialogSpy.mockReturnValue({ afterClosed: () => of({ unit_ids: [1, 2] }) });
    unitsService.combineUnits.mockReturnValue(throwError(() => ({ status: 500 })));

    component.openCombineDialog();

    expect(openSnackBarSpy).toHaveBeenCalledWith(
      'Failed to combine units',
      'Close',
      { duration: 5000 }
    );
  });

  it('should not call combineUnits when dialog is cancelled', () => {
    const unit2 = makeUnit({ ID: 2 });
    unitsService.getAllUnits.mockReturnValue(of([mockUnit, unit2]));
    fixture.detectChanges();

    openDialogSpy.mockReturnValue({ afterClosed: () => of(null) });

    component.openCombineDialog();

    expect(unitsService.combineUnits).not.toHaveBeenCalled();
  });

  it('should only pass available units to dialog', () => {
    const unit2 = makeUnit({ ID: 3, UnitNumber: 'A3' });
    unitsService.getAllUnits.mockReturnValue(of([mockUnit, unit2, occupiedUnit]));
    fixture.detectChanges();

    component.openCombineDialog();

    const passedData = openDialogSpy.mock.calls[0][1].data;

    expect(passedData.units.length).toBe(2);
    expect(passedData.units.every((u: Unit) => !u.CustomerID)).toBe(true);
  });
});