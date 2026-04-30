// src/app/pages/tenants/tenants.ts
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
import { BillingDialog } from './billing-dialog';
import { NotesDialog } from './notes-dialog';
import { UnitsService } from '../units/units.service';
import { Unit } from '../units/unit.model';
import { Auth } from '../../core/services/auth';

ModuleRegistry.registerModules([
  ClientSideRowModelModule, PaginationModule, TextFilterModule,
  NumberFilterModule, ValidationModule
]);

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatDialogModule,
    MatSnackBarModule, MatToolbarModule, MatIconModule, MatTooltipModule,
    AgGridModule, FormsModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {

  auth = inject(Auth);

  public theme = themeQuartz;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;
  viewMode: 'table' | 'grid' = 'table';
  private gridApi: any;
  
  filterQuery = '';

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
      width: 310,
      cellRenderer: (params: any) => {
        const isManager = this.auth.isManager();
        return `
          <button class="action-btn edit-btn" data-id="${params.data.ID}">Edit</button>
          <button class="action-btn billing-btn" data-id="${params.data.ID}">Billing</button>
          <button class="action-btn notes-btn" data-id="${params.data.ID}">Notes</button>
          ${isManager ? `<button class="action-btn delete-btn" data-id="${params.data.ID}">Delete</button>` : ''}
        `;
      },
      onCellClicked: (params: any) => {
        if (!params.event?.target) return;
        const target = params.event.target as HTMLElement;
        const id = parseInt(target.getAttribute('data-id') || '0', 10);

        if (target.classList.contains('edit-btn') && id > 0) {
          const customer = this.customers.find(c => c.ID === id);
          if (customer) this.openDialog(customer);
        } else if (target.classList.contains('billing-btn') && id > 0) {
          const customer = this.customers.find(c => c.ID === id);
          if (customer) this.openBillingDialog(customer);
        } else if (target.classList.contains('notes-btn') && id > 0) {
          const customer = this.customers.find(c => c.ID === id);
          if (customer) this.openNotesDialog(customer);
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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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
        this.applyFilters();
        this.loading = false;
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
      this.customerUnitsLoading = { ...this.customerUnitsLoading, [customerId]: true };
      this.tenantsService.getCustomerUnits(customerId).subscribe({
        next: (units) => {
          this.customerUnitsMap = { ...this.customerUnitsMap, [customerId]: units };
          this.customerUnitsLoading = { ...this.customerUnitsLoading, [customerId]: false };
          this.cdr.detectChanges();
        },
        error: () => {
          this.customerUnitsMap = { ...this.customerUnitsMap, [customerId]: [] };
          this.customerUnitsLoading = { ...this.customerUnitsLoading, [customerId]: false };
          this.cdr.detectChanges();
        }
      });
    }
  }

  openBillingDialog(customer: Customer) {
    this.tenantsService.getCustomerUnits(customer.ID).subscribe({
      next: (units) => {
        this.dialog.open(BillingDialog, {
          width: '640px',
          data: { customer, units }
        });
      },
      error: () => this.snackBar.open('Failed to load customer units', 'Close', { duration: 5000 })
    });
  }

  openNotesDialog(customer: Customer) {
    this.dialog.open(NotesDialog, {
      width: '560px',
      data: { customer }
    });
  }

  deassignUnit(unitNumber: string, customerId: number) {
    if (!confirm(`Remove unit ${unitNumber} from this tenant? The tenant will be moved out.`)) return;

    this.unitsService.moveout(unitNumber).subscribe({
      next: () => {
        this.snackBar.open(`Unit ${unitNumber} deassigned successfully`, 'Close', { duration: 3000 });
        delete this.customerUnitsMap[customerId];
        this.expandedCustomerId = null;
        this.toggleCustomerUnits(customerId);
      },
      error: () => this.snackBar.open('Failed to deassign unit', 'Close', { duration: 5000 })
    });
  }

  openAssignUnitDialog(customer: Customer) {
    // getAllUnits is now accessible to all employees; filter to unoccupied units only
    const units$ = this.unitsService.getAllUnits().pipe(map(units => units.filter(u => !u.CustomerID)));

    units$.subscribe({
      next: (availableUnits) => {
        const dialogRef = this.dialog.open(AssignUnitDialog, {
          width: '520px',
          data: { customer, availableUnits }
        });

        dialogRef.afterClosed().subscribe((selectedUnitNumber: string | undefined) => {
          if (!selectedUnitNumber) return;
          const unit = availableUnits.find(u => u.UnitNumber === selectedUnitNumber);
          if (!unit) return;

          this.unitsService.assignUnit(unit.UnitNumber, customer.ID).subscribe({
            next: () => {
              this.snackBar.open('Unit assigned successfully', 'Close', { duration: 3000 });
              // Refresh the customer's units — clear cache then re-fetch
              this.customerUnitsMap = { ...this.customerUnitsMap };
              delete this.customerUnitsMap[customer.ID];
              this.expandedCustomerId = null;
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

  applyFilters() {
    this.filteredCustomers = this.customers.filter(c => {
      if (this.filterQuery) {
        const q = this.filterQuery.toLowerCase();
        const fullName = `${c.FirstName} ${c.LastName}`.toLowerCase();
        return fullName.includes(q) || c.Email.toLowerCase().includes(q) || c.Phone.includes(q);
      }
      return true;
    });
    
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.filteredCustomers);
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  getInitials(customer: Customer): string {
    return `${customer.FirstName?.[0] || ''}${customer.LastName?.[0] || ''}`.toUpperCase();
  }
}