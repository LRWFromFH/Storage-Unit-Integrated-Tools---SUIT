import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AgGridModule } from 'ag-grid-angular';
import { RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { UnitsService } from './units.service';
import { Unit } from './unit.model';
import { UnitDialog } from './unit-dialog';
import { CombineDialog } from './combine-dialog';
import { InsuranceDialog } from './insurance-dialog';
import { Auth } from '../../core/services/auth';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule
} from 'ag-grid-community';
import { themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([
  ClientSideRowModelModule, PaginationModule, TextFilterModule,
  NumberFilterModule, ValidationModule
]);

@Component({
  selector: 'app-units',
  standalone: true,
  templateUrl: './units.html',
  styleUrls: ['./units.scss'],
  imports: [
    RouterLink, CommonModule, MatButtonModule,
    MatDialogModule, MatToolbarModule, MatIconModule,
    AgGridModule, MatSnackBarModule
  ]
})
export class Units implements OnInit {

  auth = inject(Auth);

  units: Unit[] = [];
  filteredUnits: Unit[] = [];
  viewMode: 'table' | 'grid' = 'table';
  public theme = themeQuartz;
  loading = false;
  defaultColDef: ColDef = { resizable: true, sortable: true, filter: true };
  private gridApi: any;

  columnDefs: ColDef[] = [
    { field: 'ID', headerName: 'ID', sortable: true, filter: true, width: 90 },
    { field: 'UnitNumber', headerName: 'Unit #', sortable: true, filter: true, flex: 1 },
    { field: 'SizeType', headerName: 'Size Type', sortable: true },
    { field: 'Length', headerName: 'Length (ft)', sortable: true },
    { field: 'Width', headerName: 'Width (ft)', sortable: true },
    { field: 'Height', headerName: 'Height (ft)', sortable: true },
    {
      field: 'Price',
      headerName: 'Price',
      sortable: true,
      valueFormatter: p => `$${Number(p.value).toFixed(2)}`
    },
    {
      field: 'Combined',
      headerName: 'Combined',
      sortable: true,
      valueFormatter: p => p.value ? 'Yes' : 'No'
    },
    {
      headerName: 'Status',
      valueGetter: params => params.data.CustomerID ? 'Occupied' : 'Available',
      sortable: true
    },
    {
      headerName: 'Actions',
      width: 260,
      cellRenderer: (params: any) => {
        const isManager = this.auth.isManager();
        return `
          <button class="action-btn edit-btn" data-unitnumber="${params.data.UnitNumber || ''}">Edit</button>
          <button class="action-btn insurance-btn" data-unitnumber="${params.data.UnitNumber || ''}">Insurance</button>
          ${isManager ? `<button class="action-btn delete-btn" data-unitnumber="${params.data.UnitNumber || ''}">Delete</button>` : ''}
        `;
      },
      onCellClicked: (params: any) => {
        if (!params.event?.target) return;
        const target = params.event.target as HTMLElement;
        const unitNumber = target.getAttribute('data-unitnumber') || '';

        if (target.classList.contains('edit-btn') && unitNumber) {
          const unit = this.units.find(u => u.UnitNumber === unitNumber);
          if (unit) this.openDialog(unit);
        } else if (target.classList.contains('insurance-btn') && unitNumber) {
          const unit = this.units.find(u => u.UnitNumber === unitNumber);
          if (unit) this.openInsuranceDialog(unit);
        } else if (target.classList.contains('delete-btn') && unitNumber) {
          if (confirm(`Delete unit ${unitNumber}?`)) {
            this.deleteUnit(unitNumber);
          }
        }
      }
    }
  ];

  constructor(
    private unitsService: UnitsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  loadUnits() {
    this.loading = true;
    this.unitsService.getAllUnits().subscribe({
      next: (data) => {
        this.units = data;
        this.filteredUnits = [...data];
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.snackBar.open('Failed to load units', 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  openDialog(unit?: Unit) {
    const dialogRef = this.dialog.open(UnitDialog, {
      width: '520px',
      data: unit || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (unit) {
        this.unitsService.updateUnit(unit.UnitNumber, result).subscribe({
          next: () => {
            this.snackBar.open('Unit updated successfully', 'Close', { duration: 3000 });
            this.loadUnits();
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open('Failed to update unit', 'Close', { duration: 5000 });
          }
        });
      } else {
        this.unitsService.createUnit(result).subscribe({
          next: () => {
            this.snackBar.open('Unit created successfully', 'Close', { duration: 3000 });
            this.loadUnits();
          },
          error: (err: HttpErrorResponse) => {
            console.error(err);
            this.snackBar.open('Failed to create unit. Unit number may already exist.', 'Close', { duration: 6000 });
          }
        });
      }
    });
  }

  deleteUnit(unitNumber: string) {
    this.unitsService.deleteUnit(unitNumber).subscribe({
      next: () => {
        this.snackBar.open('Unit deleted successfully', 'Close', { duration: 3000 });
        this.loadUnits();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to delete unit', 'Close', { duration: 5000 });
      }
    });
  }

  openCombineDialog() {
    const availableUnits = this.units.filter(u => !u.CustomerID);
    if (availableUnits.length < 2) {
      this.snackBar.open('Need at least 2 available units to combine', 'Close', { duration: 4000 });
      return;
    }
    const dialogRef = this.dialog.open(CombineDialog, {
      width: '560px',
      data: { units: availableUnits }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const unitsToDelete = availableUnits.filter(u => result.unit_ids.includes(u.ID));
      this.unitsService.combineUnits(result).subscribe({
        next: () => {
          const deletions = unitsToDelete.map(u =>
            this.unitsService.deleteUnit(u.UnitNumber).pipe(catchError(() => of(null)))
          );
          forkJoin(deletions.length ? deletions : [of(null)]).subscribe(() => {
            this.snackBar.open('Units combined successfully', 'Close', { duration: 3000 });
            this.loadUnits();
          });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to combine units', 'Close', { duration: 5000 });
        }
      });
    });
  }

  openInsuranceDialog(unit: Unit) {
    this.dialog.open(InsuranceDialog, {
      width: '480px',
      data: { unit }
    });
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }
}