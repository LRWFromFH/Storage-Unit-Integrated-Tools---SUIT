import {
  Component,
  inject,
  signal,
  HostListener,
  ViewChild,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, map } from 'rxjs/operators';
import { Auth } from '../core/services/auth';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

interface SearchResult {
  label: string;
  icon: string;
  route: string;
  category: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatBadgeModule,
    MatChipsModule,
  ],
  templateUrl: './app-layout.html',
  styleUrls: ['./app-layout.scss'],
})
export class AppLayout implements OnInit {
  auth = inject(Auth);
  private router = inject(Router);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidenavOpen = signal(true);
  sidenavCollapsed = signal(false);
  sidenavMode = signal<'side' | 'over'>('side');

  // ── Dark Mode ──────────────────────────────────────────────────────────────
  isDarkMode = signal(false);

  // ── Global Search ──────────────────────────────────────────────────────────
  searchQuery = signal('');
  searchFocused = signal(false);

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  breadcrumbs = signal<{ label: string; route: string }[]>([]);

  // ── Nav Items ──────────────────────────────────────────────────────────────
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',          route: '/'        },
    { label: 'Units',     icon: 'warehouse',           route: '/units'   },
    { label: 'Tenants',   icon: 'people',              route: '/tenants' },
    { label: 'Register',  icon: 'admin_panel_settings',route: '/register', roles: ['manager'] },
  ];

  // ── Search Suggestions ─────────────────────────────────────────────────────
  private allResults: SearchResult[] = [
    { label: 'Dashboard',          icon: 'dashboard',           route: '/',        category: 'Pages'   },
    { label: 'Units Overview',     icon: 'warehouse',           route: '/units',   category: 'Pages'   },
    { label: 'Tenants List',       icon: 'people',              route: '/tenants', category: 'Pages'   },
    { label: 'Employee Management',icon: 'admin_panel_settings',route: '/register',category: 'Manager' },
  ];

  filteredResults = signal<SearchResult[]>([]);

  ngOnInit() {
    // Load persisted theme and sidebar state
    const savedTheme = localStorage.getItem('suit-theme');
    if (savedTheme === 'dark') {
      this.isDarkMode.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    const savedCollapse = localStorage.getItem('suit-sidebar-collapsed');
    if (savedCollapse === 'true') {
      this.sidenavCollapsed.set(true);
    }

    // Breadcrumb tracking via router events
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        map((e) => (e as NavigationEnd).urlAfterRedirects)
      )
      .subscribe(url => this.updateBreadcrumbs(url));

    // Set initial breadcrumbs
    this.updateBreadcrumbs(this.router.url);

    // Check initial viewport
    this.checkViewport();
  }

  // ── Ctrl+K Keyboard Shortcut ───────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      const searchEl = document.getElementById('global-search-input');
      if (searchEl) searchEl.focus();
    }
  }

  @HostListener('window:resize')
  checkViewport() {
    const mobile = window.innerWidth < 768;
    this.sidenavMode.set(mobile ? 'over' : 'side');
    if (mobile) {
      this.sidenavOpen.set(false);
      this.sidenavCollapsed.set(false);
    } else {
      this.sidenavOpen.set(true);
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  onSearchInput(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.filteredResults.set([]);
      return;
    }
    const q = query.toLowerCase();
    this.filteredResults.set(
      this.allResults.filter(r =>
        r.label.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      )
    );
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.searchQuery.set('');
    this.filteredResults.set([]);
  }

  // ── Theme Toggle ───────────────────────────────────────────────────────────
  toggleTheme() {
    const dark = !this.isDarkMode();
    this.isDarkMode.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    localStorage.setItem('suit-theme', dark ? 'dark' : 'light');
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  toggleSidenav() {
    const mobile = window.innerWidth < 768;
    if (mobile) {
      this.sidenavOpen.update(v => !v);
    } else {
      this.sidenavCollapsed.update(v => {
        const newState = !v;
        localStorage.setItem('suit-sidebar-collapsed', String(newState));
        return newState;
      });
    }
  }

  isActiveRoute(route: string): boolean {
    if (route === '/') return this.router.url === '/';
    return this.router.url.startsWith(route);
  }

  visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (!item.roles) return true;
      return this.auth.isManager();
    });
  }

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  private updateBreadcrumbs(url: string) {
    const routeMap: Record<string, string> = {
      '/':         'Dashboard',
      '/units':    'Units',
      '/tenants':  'Tenants',
      '/register': 'Register Employee',
    };

    const crumbs: { label: string; route: string }[] = [
      { label: 'Home', route: '/' },
    ];

    if (url !== '/') {
      const label = routeMap[url] ?? url.replace('/', '').replace(/-/g, ' ');
      crumbs.push({ label, route: url });
    }

    this.breadcrumbs.set(crumbs);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async logout() {
    try {
      await this.auth.logout();
    } finally {
      this.router.navigate(['/login']);
    }
  }
}