import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, ClientSideRowModelModule, PaginationModule, TextFilterModule } from 'ag-grid-community';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { themeQuartz } from 'ag-grid-community';

import { ApiService } from '../../core/services/api.service';

ModuleRegistry.registerModules([ClientSideRowModelModule, PaginationModule, TextFilterModule]);

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    AgGridModule
  ],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {

  private apiService = inject(ApiService);
  public theme = themeQuartz;

  tenants: any[] = [];
  filteredTenants: any[] = [];

  viewMode: 'table' | 'grid' = 'table';
  hoveredTenant: string | null = null;

  setHoverTenant(id: string | null) {
    this.hoveredTenant = id;
  }

  columnDefs: ColDef[] = [
    { field: 'ID', headerName: 'ID', sortable: true, filter: true },
    { field: 'FirstName', headerName: 'First Name', sortable: true, filter: true },
    { field: 'LastName', headerName: 'Last Name', sortable: true, filter: true },
    { field: 'Email', headerName: 'Email', sortable: true },
    { field: 'Phone', headerName: 'Phone' },
    { field: 'Address', headerName: 'Address' },
    { field: 'CreatedAt', headerName: 'Joined', valueFormatter: p => new Date(p.value).toLocaleDateString() }
  ];

  async ngOnInit() {
    await this.loadTenants();
  }

  async loadTenants() {
    try {
      this.tenants = await this.apiService.getCustomersList();
      // Transform map if needed or use direct struct fields. 
      // The Go backend sends JSON fields capitalized if they aren't struct tagged to lower, 
      // e.g. ID, FirstName, LastName, Email, Phone, Address, CreatedAt
      this.filteredTenants = [...this.tenants];
    } catch (e) {
      console.error('Failed to load tenants from backend', e);
    }
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }

}