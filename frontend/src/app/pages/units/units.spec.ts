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

  const configureTestBed = async (isManager = false) => {
    authService = {
      isManager: vi.fn().mockReturnValue(isManager),
      role: vi.fn().mockReturnValue(isManager ? 'manager' : 'employee')
    };

    unitsService = {
      getUnits:     vi.fn().mockReturnValue(of([])),
      getAllUnits:   vi.fn().mockReturnValue(of([])),
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

  describe('as employee', () => {
    beforeEach(async () => configureTestBed(false));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should call getUnits (not getAllUnits) on init', () => {
      fixture.detectChanges();
      expect(unitsService.getUnits).toHaveBeenCalled();
      expect(unitsService.getAllUnits).not.toHaveBeenCalled();
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
  });

  describe('as manager', () => {
    beforeEach(async () => configureTestBed(true));

    it('should call getAllUnits (not getUnits) on init', () => {
      fixture.detectChanges();
      expect(unitsService.getAllUnits).toHaveBeenCalled();
      expect(unitsService.getUnits).not.toHaveBeenCalled();
    });

    it('should include occupied units in filteredUnits', () => {
      unitsService.getAllUnits.mockReturnValue(of([mockUnit, occupiedUnit]));
      fixture.detectChanges();
      expect(component.filteredUnits.length).toBe(2);
    });
  });

  describe('actions (as employee)', () => {
    beforeEach(async () => configureTestBed(false));

    it('should toggle between table and grid view', () => {
      component.toggleView('grid');
      expect(component.viewMode).toBe('grid');

      component.toggleView('table');
      expect(component.viewMode).toBe('table');
    });

    it('should call deleteUnit service on success', () => {
      component.deleteUnit('A1');
      expect(unitsService.deleteUnit).toHaveBeenCalledWith('A1');
      expect(openSnackBarSpy).toHaveBeenCalledWith('Unit deleted successfully', 'Close', { duration: 3000 });
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

  describe('combine dialog', () => {
    beforeEach(async () => configureTestBed(false));

    it('should show snackbar if fewer than 2 available units exist', () => {
      unitsService.getUnits.mockReturnValue(of([mockUnit]));
      fixture.detectChanges();
      component.openCombineDialog();
      expect(openSnackBarSpy).toHaveBeenCalledWith(
        'Need at least 2 available units to combine',
        'Close',
        { duration: 4000 }
      );
      expect(openDialogSpy).not.toHaveBeenCalled();
    });

    it('should open combine dialog when 2+ available units exist', () => {
      const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
      unitsService.getUnits.mockReturnValue(of([mockUnit, unit2]));
      fixture.detectChanges();
      component.openCombineDialog();
      expect(openDialogSpy).toHaveBeenCalled();
    });

    it('should call combineUnits and delete originals on success', () => {
      const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
      unitsService.getUnits.mockReturnValue(of([mockUnit, unit2]));
      fixture.detectChanges();

      const combineResult = { unit_ids: [1, 2], price: 200 };
      openDialogSpy.mockReturnValue({ afterClosed: () => of(combineResult) });

      component.openCombineDialog();

      expect(unitsService.combineUnits).toHaveBeenCalledWith(combineResult);
      expect(unitsService.deleteUnit).toHaveBeenCalledWith('A1');
      expect(unitsService.deleteUnit).toHaveBeenCalledWith('A2');
    });

    it('should show snackbar on combine error', () => {
      const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
      unitsService.getUnits.mockReturnValue(of([mockUnit, unit2]));
      fixture.detectChanges();

      openDialogSpy.mockReturnValue({ afterClosed: () => of({ unit_ids: [1, 2], price: 200 }) });
      unitsService.combineUnits.mockReturnValue(throwError(() => ({ status: 500 })));

      component.openCombineDialog();

      expect(openSnackBarSpy).toHaveBeenCalledWith('Failed to combine units', 'Close', { duration: 5000 });
    });

    it('should not call combineUnits when dialog is cancelled', () => {
      const unit2 = makeUnit({ ID: 2, UnitNumber: 'A2' });
      unitsService.getUnits.mockReturnValue(of([mockUnit, unit2]));
      fixture.detectChanges();

      openDialogSpy.mockReturnValue({ afterClosed: () => of(null) });
      component.openCombineDialog();

      expect(unitsService.combineUnits).not.toHaveBeenCalled();
    });

    it('should only pass available units (non-occupied) to the combine dialog', () => {
      // 2 available + 1 occupied — dialog must open and must receive only the available two
      const unit2 = makeUnit({ ID: 3, UnitNumber: 'A3' });
      unitsService.getUnits.mockReturnValue(of([mockUnit, unit2, occupiedUnit]));
      fixture.detectChanges();

      component.openCombineDialog();

      const passedData = openDialogSpy.mock.calls[0]?.[1]?.data;
      expect(passedData).toBeDefined();
      expect(passedData.units.every((u: Unit) => !u.CustomerID)).toBe(true);
      expect(passedData.units.length).toBe(2);
    });
  });
});
