import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Units } from './units';
import { UnitsService } from './units.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

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

    // ✅ IMPORTANT: fully mock dialog (no real Material usage)
    dialogSpy = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(null)
      })
    };

    snackBarSpy = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        provideRouter([]),
        { provide: UnitsService, useValue: unitsService },
        { provide: MatDialog, useValue: dialogSpy }, // ✅ force mock
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

  it('should set units after loading', () => {
    const mockUnits = [{ UnitNumber: 'U1' }] as any;

    unitsService.getUnits.mockReturnValue(of(mockUnits));

    fixture.detectChanges();

    expect(component.units).toEqual(mockUnits);
    expect(component.filteredUnits).toEqual(mockUnits);
  });

  it('should toggle between table and grid view', () => {
    component.toggleView('grid');
    expect(component.viewMode).toBe('grid');

    component.toggleView('table');
    expect(component.viewMode).toBe('table');
  });

  it('should call deleteUnit service', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteUnit('U1');

    expect(unitsService.deleteUnit).toHaveBeenCalledWith('U1');
  });

});