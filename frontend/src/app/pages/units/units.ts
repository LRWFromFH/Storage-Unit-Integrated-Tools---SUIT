import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
    MatCardModule,
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
    { field: 'ID', headerName: 'ID', sortable: true, filter: true },
    { field: 'UnitNumber', headerName: 'Unit #', sortable: true, filter: true },
    { field: 'SizeType', headerName: 'Type', sortable: true },
    { field: 'Length', headerName: 'Length', sortable: true },
    { field: 'Width', headerName: 'Width', sortable: true },
    { field: 'Height', headerName: 'Height', sortable: true },
    {
      field: 'Price',
      headerName: 'Price /mo',
      valueFormatter: p => `$${p.value}`
    },
    { 
      field: 'CustomerID', 
      headerName: 'Status', 
      valueFormatter: p => p.value !== null ? 'Occupied' : 'Available',
      sortable: true 
    },
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
    this.filteredUnits = this.units.filter((unit: any) => {

      const matchesSearch = this.searchTerm.trim() === '' || 
        (unit.UnitNumber && unit.UnitNumber.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const computedStatus = (unit.CustomerID !== null && unit.CustomerID !== undefined && unit.CustomerID !== 0) ? 'Occupied' : 'Available';
      const matchesStatus =
        this.statusFilter === 'All' || computedStatus === this.statusFilter;

      const matchesType =
        this.typeFilter === 'All' || unit.SizeType === this.typeFilter;

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
  hoveredUnit: string | null = null;

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }

  setHoverUnit(id: string | null) {
    this.hoveredUnit = id;
  }
}