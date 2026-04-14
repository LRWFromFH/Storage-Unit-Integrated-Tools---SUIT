import { Component, OnInit, OnDestroy, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
// @ts-ignore
import AOS from 'aos';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Auth } from '../core/services/auth';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatListModule,
    MatAutocompleteModule
  ],
  templateUrl: './app-layout.html',
  styleUrls: ['./app-layout.scss']
})
export class AppLayout implements OnInit, OnDestroy {

  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private location = inject(Location);

  isDarkMode = false;
  searchQuery = '';
  showSearch = false;
  isSidebarCollapsed = false;
  currentPath = 'Dashboard';
  
  @ViewChild('searchInput') searchInput!: ElementRef;

  private sessionTimer: any;
  private readonly SESSION_MINUTES = 30;

  ngOnInit() {
    AOS.init({ duration: 800, once: true });
    this.startSessionWarningTimer();
    
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateBreadcrumb(event.urlAfterRedirects);
      }
    });
    this.updateBreadcrumb(this.router.url);
  }
  
  updateBreadcrumb(url: string) {
    const path = url.split('?')[0].split('/').filter(p => p).pop();
    if (path) {
      this.currentPath = path.charAt(0).toUpperCase() + path.slice(1);
    } else {
      this.currentPath = 'Dashboard';
    }
  }

  ngOnDestroy() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
  }

  private startSessionWarningTimer() {
    // Warn user 5 minutes before the 30-minute session expires
    const warnAtMs = (this.SESSION_MINUTES - 5) * 60 * 1000;
    this.sessionTimer = setTimeout(() => {
      this.snackBar.open(
        '⚠️ Your session expires in 5 minutes. Save your work!',
        'Extend',
        { duration: 15000, panelClass: ['session-warning-snackbar'] }
      );
    }, warnAtMs);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  @HostListener('document:keydown.control.k', ['$event'])
  @HostListener('document:keydown.meta.k', ['$event'])
  handleKeyboardEvent(event: any) {
    event.preventDefault();
    this.showSearch = true;
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    this.searchQuery = '';
    if (this.showSearch) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
    }
  }

  // Mock global search options
  allSearchOptions = ['Unit A-101', 'Unit B-205', 'John Doe (Tenant)', 'Jane Smith (Tenant)', 'Alice (Employee)'];
  
  get filteredOptions(): string[] {
    const filterValue = this.searchQuery.toLowerCase();
    return this.allSearchOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
      this.showSearch = false;
      this.searchQuery = '';
    }
  }
  
  goBack() {
    this.location.back();
  }

  async logout() {
    try {
      await this.auth.logout();
    } finally {
      this.router.navigate(['/login']);
    }
  }
}