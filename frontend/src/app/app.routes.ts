import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Units } from './pages/units/units';
import { Tenants } from './pages/tenants/tenants';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    { path: 'login', component: Login },
    { path: 'dashboard', component: Dashboard },
    { path: 'units', component: Units },
    { path: 'tenants', component: Tenants },

    { path: '**', redirectTo: 'login' }
];
