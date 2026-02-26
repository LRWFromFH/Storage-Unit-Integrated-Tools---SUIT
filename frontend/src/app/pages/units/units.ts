import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule
]);
@Component({
  selector: 'app-units',
  standalone: true,
  templateUrl: './units.html',
  styleUrls: ['./units.scss'],
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatIconModule,
    AgGridModule
  ]
})
export class Units implements OnInit {

  units: Unit[] = [];
  filteredUnits: Unit[] = [];
  public theme = themeQuartz;
  searchTerm = '';
  statusFilter = 'All';
  typeFilter = 'All';

  columnDefs: ColDef[] = [
    { field: 'unitNumber', headerName: 'Unit #', sortable: true, filter: true },
    { field: 'unitType', headerName: 'Type', sortable: true },
    { field: 'sizeSqFt', headerName: 'Sq Ft', sortable: true },
    { field: 'floor', headerName: 'Floor', sortable: true },
    {
      field: 'climateControlled',
      headerName: 'Climate',
      valueFormatter: p => p.value ? 'Yes' : 'No'
    },
    {
      field: 'pricePerMonth',
      headerName: 'Price',
      valueFormatter: p => `$${p.value}`
    },
    { field: 'status', headerName: 'Status', sortable: true },
    { field: 'tenantName', headerName: 'Tenant' },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        return `
          <button class="action-btn edit">Edit</button>
          <button class="action-btn delete">Delete</button>
        `;
      }
    }
  ];

  constructor(
    private unitsService: UnitsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.unitsService.getUnits().subscribe(data => {
      this.units = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredUnits = this.units.filter(unit => {

      const matchesSearch =
        unit.unitNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (unit.tenantName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);

      const matchesStatus =
        this.statusFilter === 'All' || unit.status === this.statusFilter;

      const matchesType =
        this.typeFilter === 'All' || unit.unitType === this.typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  openDialog(unit?: Unit) {
    const dialogRef = this.dialog.open(UnitDialog, {
      width: '500px',
      data: unit || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (unit) {
        this.unitsService.updateUnit(result);
      } else {
        this.unitsService.addUnit({
          ...result,
          id: Date.now().toString(),
          lastUpdated: new Date()
        });
      }
    });
  }

  deleteUnit(id: string) {
    this.unitsService.deleteUnit(id);
  }
  viewMode: 'table' | 'grid' = 'table';

toggleView(mode: 'table' | 'grid') {
  this.viewMode = mode;
}
}