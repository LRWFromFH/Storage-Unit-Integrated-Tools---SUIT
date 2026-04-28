import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Auth } from '../../core/services/auth';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Customer } from '../tenants/tenants.model';
import { Unit } from '../units/unit.model';
import { UnitsService } from '../units/units.service';
import { TenantsService } from '../tenants/tenants.service';

interface SearchResponse {
  customers: Customer[];
  units: Unit[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);
  private unitsService = inject(UnitsService);
  private tenantsService = inject(TenantsService);

  private readonly API_URL = 'http://localhost:8080/api';

  searchQuery = '';
  searchResults: SearchResponse | null = null;
  searching = false;

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.searchResults = null;
          this.searching = false;
          return [];
        }
        this.searching = true;
        return this.http.post<SearchResponse>(`${this.API_URL}/searchDB`, { query });
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results as SearchResponse;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }

  totalUnits = 0;
  totalTenants = 0;
  occupiedUnits = 0;
  statsLoading = true;
  private loadedCount = 0;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.unitsService.getAllUnits().subscribe({
      next: (units) => {
        this.totalUnits = units.length;
        this.occupiedUnits = units.filter(u => u.CustomerID !== null && u.CustomerID !== 0).length;
        this.checkStatsLoaded();
      },
      error: () => this.checkStatsLoaded()
    });

    this.tenantsService.getCustomers().subscribe({
      next: (tenants) => {
        this.totalTenants = tenants.length;
        this.checkStatsLoaded();
      },
      error: () => this.checkStatsLoaded()
    });
  }

  private checkStatsLoaded() {
    this.loadedCount++;
    if (this.loadedCount >= 2) {
      this.statsLoading = false;
    }
  }

  onSearchInput(value: string) {
    if (!value.trim()) {
      this.searchResults = null;
      this.searching = false;
    }
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = null;
    this.searching = false;
    this.searchSubject.next('');
  }

  goToTenant(_customerId: number) {
    this.router.navigate(['/tenants']);
  }

  goToUnit(_unitNumber: string) {
    this.router.navigate(['/units']);
  }

  get hasResults(): boolean {
    return !!this.searchResults &&
      (this.searchResults.customers.length > 0 || this.searchResults.units.length > 0);
  }

  get noResults(): boolean {
    return !!this.searchResults && !this.searching &&
      this.searchResults.customers.length === 0 && this.searchResults.units.length === 0;
  }
}
