import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './search.html',
  styleUrls: ['./search.scss']
})
export class Search implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  query = '';
  customers: any[] = [];
  units: any[] = [];
  isLoading = false;

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.query = params['q'] || '';
      if (this.query) {
        await this.doSearch();
      }
    });
  }

  async doSearch() {
    try {
      this.isLoading = true;
      const res = await this.api.search(this.query);
      this.customers = res.customers ?? [];
      this.units = res.units ?? [];
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      this.isLoading = false;
    }
  }

  get hasResults(): boolean {
    return this.customers.length > 0 || this.units.length > 0;
  }
}
