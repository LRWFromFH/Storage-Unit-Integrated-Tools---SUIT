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
  private gridApi: any;                    // ← Keep this

  viewMode: 'table' | 'grid' = 'table';

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
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  // ← THIS IS REQUIRED
  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  loadCustomers() {
    this.loading = true;
    this.tenantsService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;

        // Safely update grid if it exists
        if (this.gridApi) {
          this.gridApi.setRowData(data);
        }
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

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }
}