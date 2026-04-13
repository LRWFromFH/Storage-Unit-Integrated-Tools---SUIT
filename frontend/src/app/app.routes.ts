import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Units } from './pages/units/units';
import { Tenants } from './pages/tenants/tenants';
import { Register } from './pages/register/register';
import { AppLayout } from './layout/app-layout';
import { authGuard } from './core/guards/auth-guard';
import { managerGuard } from './core/guards/manager.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
      { path: 'units',     component: Units,     canActivate: [authGuard] },
      { path: 'tenants',   component: Tenants,   canActivate: [authGuard] },
      { path: 'register',  component: Register,  canActivate: [authGuard, managerGuard] },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
