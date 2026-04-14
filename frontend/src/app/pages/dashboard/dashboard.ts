import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { ApiService } from '../../core/services/api.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  private auth = inject(Auth);
  private router = inject(Router);
  private api = inject(ApiService);

  hoveredCard: string | null = null;
  stats: { totalUnits: number; occupiedUnits: number; availableUnits: number; totalTenants: number } | null = null;

  setHoverCard(card: string | null) {
    this.hoveredCard = card;
  }

  async ngOnInit() {
    try {
      this.stats = await this.api.getStats();
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }

  get occupancyRate(): number {
    if (!this.stats || this.stats.totalUnits === 0) return 0;
    return Math.round((this.stats.occupiedUnits / this.stats.totalUnits) * 100);
  }

  async logout() {
    try {
      await this.auth.logout();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      this.router.navigate(['/login']);
    }
  }
}
