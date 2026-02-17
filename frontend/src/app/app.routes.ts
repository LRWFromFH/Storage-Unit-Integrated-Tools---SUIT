import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Units } from './pages/units/units';
import { Tenants } from './pages/tenants/tenants';
import { authGuard } from './core/guards/auth-guard';
import { Register } from './pages/register/register';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    { path: 'login', component: Login },
    { path: 'register', component: Register },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard]
    },

    {
        path: 'units',
        component: Units,
        canActivate: [authGuard]
    },

    {
        path: 'tenants',
        component: Tenants,
        canActivate: [authGuard]
    },

    { path: '**', redirectTo: 'login' }
];
