import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  private auth = inject(Auth);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
