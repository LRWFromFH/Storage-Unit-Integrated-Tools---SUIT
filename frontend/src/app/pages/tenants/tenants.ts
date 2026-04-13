// src/app/pages/tenants/tenants.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

import { themeQuartz } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule
} from 'ag-grid-community';

import { TenantsService } from './tenants.service';
import { Customer } from './tenants.model';
import { TenantDialog } from './tenant-dialog';
import { AssignUnitDialog } from './assign-unit-dialog';
import { UnitsService } from '../units/units.service';
import { Unit } from '../units/unit.model';

ModuleRegistry.registerModules([
  ClientSideRowModelModule, PaginationModule, TextFilterModule,
  NumberFilterModule, ValidationModule
]);

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatDialogModule,
    MatSnackBarModule, MatToolbarModule, MatIconModule, AgGridModule
  ],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {

  public theme = themeQuartz;
  customers: Customer[] = [];
  loading = false;
  viewMode: 'table' | 'grid' = 'table';
  private gridApi: any;

  // Tracks which customer's units are expanded (card view)
  expandedCustomerId: number | null = null;
  customerUnitsMap: Record<number, Unit[]> = {};
  customerUnitsLoading: Record<number, boolean> = {};

  columnDefs: ColDef[] = [
    { field: 'ID', headerName: 'ID', sortable: true, filter: true, width: 80 },
    { field: 'FirstName', headerName: 'First Name', sortable: true },
    { field: 'LastName', headerName: 'Last Name', sortable: true },
    { field: 'Email', headerName: 'Email', sortable: true },
    { field: 'Phone', headerName: 'Phone', sortable: true },
    { field: 'Address', headerName: 'Address', sortable: true, flex: 1 },
    {
      headerName: 'Actions',
      width: 180,
      cellRenderer: (params: any) => `
        <button class="action-btn edit-btn" data-id="${params.data.ID}">Edit</button>
        <button class="action-btn delete-btn" data-id="${params.data.ID}">Delete</button>
      `,
      onCellClicked: (params: any) => {
        if (!params.event?.target) return;
        const target = params.event.target as HTMLElement;
        const id = parseInt(target.getAttribute('data-id') || '0', 10);

        if (target.classList.contains('edit-btn') && id > 0) {
          const customer = this.customers.find(c => c.ID === id);
          if (customer) this.openDialog(customer);
        } else if (target.classList.contains('delete-btn') && id > 0) {
          if (confirm(`Delete customer ${params.data.FirstName} ${params.data.LastName}?`)) {
            this.deleteCustomer(id);
          }
        }
      }
    }
  ];

  constructor(
    private tenantsService: TenantsService,
    private unitsService: UnitsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  loadCustomers() {
    this.loading = true;
    this.tenantsService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
        this.gridApi?.setGridOption('rowData', data);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading customers:', err);
        this.snackBar.open('Failed to load customers', 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  openDialog(customer?: Customer) {
    const dialogRef = this.dialog.open(TenantDialog, {
      width: '500px',
      data: customer || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (customer) {
        this.tenantsService.updateCustomer(customer.ID, result).subscribe({
          next: () => {
            this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
            this.loadCustomers();
          },
          error: () => this.snackBar.open('Failed to update customer', 'Close', { duration: 5000 })
        });
      } else {
        this.tenantsService.createCustomer(result).subscribe({
          next: () => {
            this.snackBar.open('Customer created successfully', 'Close', { duration: 3000 });
            this.loadCustomers();
          },
          error: () => this.snackBar.open('Failed to create customer', 'Close', { duration: 5000 })
        });
      }
    });
  }

  deleteCustomer(id: number) {
    this.tenantsService.deleteCustomer(id).subscribe({
      next: () => {
        this.snackBar.open('Customer deleted successfully', 'Close', { duration: 3000 });
        this.loadCustomers();
      },
      error: () => this.snackBar.open('Failed to delete customer', 'Close', { duration: 5000 })
    });
  }

  toggleCustomerUnits(customerId: number) {
    if (this.expandedCustomerId === customerId) {
      this.expandedCustomerId = null;
      return;
    }
    this.expandedCustomerId = customerId;
    if (!this.customerUnitsMap[customerId]) {
      this.customerUnitsLoading[customerId] = true;
      this.tenantsService.getCustomerUnits(customerId).subscribe({
        next: (units) => {
          this.customerUnitsMap[customerId] = units;
          this.customerUnitsLoading[customerId] = false;
        },
        error: () => {
          this.customerUnitsMap[customerId] = [];
          this.customerUnitsLoading[customerId] = false;
        }
      });
    }
  }

  openAssignUnitDialog(customer: Customer) {
    this.unitsService.getUnits().subscribe({
      next: (availableUnits) => {
        const dialogRef = this.dialog.open(AssignUnitDialog, {
          width: '520px',
          data: { customer, availableUnits }
        });

        dialogRef.afterClosed().subscribe((selectedUnitNumber: string | undefined) => {
          if (!selectedUnitNumber) return;
          const unit = availableUnits.find(u => u.UnitNumber === selectedUnitNumber);
          if (!unit) return;

          this.unitsService.assignUnit(unit, customer.ID).subscribe({
            next: () => {
              this.snackBar.open('Unit assigned successfully', 'Close', { duration: 3000 });
              // Refresh the customer's units
              delete this.customerUnitsMap[customer.ID];
              this.expandedCustomerId = customer.ID;
              this.toggleCustomerUnits(customer.ID);
            },
            error: () => this.snackBar.open('Failed to assign unit', 'Close', { duration: 5000 })
          });
        });
      },
      error: () => this.snackBar.open('Failed to load available units', 'Close', { duration: 5000 })
    });
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }
}