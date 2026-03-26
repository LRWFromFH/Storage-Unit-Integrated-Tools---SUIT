import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AgGridModule } from 'ag-grid-angular';
import { RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { UnitsService } from './units.service';
import { Unit } from './unit.model';
import { UnitDialog } from './unit-dialog';
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
    RouterLink, CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDialogModule, MatToolbarModule, MatIconModule,
    AgGridModule, MatSnackBarModule
  ]
})
export class Units implements OnInit {

  units: Unit[] = [];
  filteredUnits: Unit[] = [];
  public theme = themeQuartz;
  loading = false;
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
      width: 180,
      cellRenderer: (params: any) => `
        <button class="action-btn edit-btn" data-unitnumber="${params.data.UnitNumber || ''}">Edit</button>
        <button class="action-btn delete-btn" data-unitnumber="${params.data.UnitNumber || ''}">Delete</button>
      `,
      onCellClicked: (params: any) => {
        if (!params.event?.target) return;
        const target = params.event.target as HTMLElement;
        const unitNumber = target.getAttribute('data-unitnumber') || '';

        if (target.classList.contains('edit-btn') && unitNumber) {
          const unit = this.units.find(u => u.UnitNumber === unitNumber);
          if (unit) this.openDialog(unit);
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
    this.unitsService.getUnits().subscribe({
      next: (data) => {
        this.units = data;
        this.filteredUnits = [...data];
        this.loading = false;
        if (this.gridApi) this.gridApi.setRowData(data);
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
        // CREATE
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

  viewMode: 'table' | 'grid' = 'table';

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }
}