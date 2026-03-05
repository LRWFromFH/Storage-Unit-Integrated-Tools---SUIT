import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

import { MatButtonModule } from '@angular/material/button';

import { themeQuartz } from 'ag-grid-community';

import { Tenant } from './tenants.model';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    AgGridModule
  ],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {

  public theme = themeQuartz;

  tenants: Tenant[] = [];
  filteredTenants: Tenant[] = [];

  viewMode: 'table' | 'grid' = 'table';

  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    { field: 'email', headerName: 'Email', sortable: true },
    { field: 'phone', headerName: 'Phone' },
    { field: 'unitNumber', headerName: 'Unit #' },
    {
      field: 'moveInDate',
      headerName: 'Move In',
      valueFormatter: p => new Date(p.value).toLocaleDateString()
    },
    {
      field: 'insurance',
      headerName: 'Insurance',
      valueFormatter: p => p.value ? 'Yes' : 'No'
    },
    { field: 'status', headerName: 'Status' }
  ];

  ngOnInit(): void {
    this.loadMockTenants();
  }

  loadMockTenants() {

    this.tenants = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '352-111-2222',
        unitNumber: 'A101',
        moveInDate: new Date('2025-10-01'),
        insurance: true,
        status: 'Active'
      },
      {
        id: '2',
        name: 'Michael Smith',
        email: 'michael@example.com',
        phone: '352-333-4444',
        unitNumber: 'B204',
        moveInDate: new Date('2025-09-15'),
        insurance: false,
        status: 'Pending'
      },
      {
        id: '3',
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        phone: '352-555-7777',
        unitNumber: 'C305',
        moveInDate: new Date('2025-07-22'),
        insurance: true,
        status: 'Active'
      }
    ];

    this.filteredTenants = [...this.tenants];
  }

  toggleView(mode: 'table' | 'grid') {
    this.viewMode = mode;
  }

}