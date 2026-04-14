import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Units } from './pages/units/units';
import { Tenants } from './pages/tenants/tenants';
import { Employees } from './pages/employees/employees';
import { Search } from './pages/search/search';
import { authGuard } from './core/guards/auth-guard';
import { Register } from './pages/register/register';
import { AppLayout } from './layout/app-layout';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: '', component: AppLayout,
        children:[
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

    {
        path: 'employees',
        component: Employees,
        canActivate: [authGuard]
    },

    {
        path: 'search',
        component: Search,
        canActivate: [authGuard]
    }
        ]
    },
    { path: '**', redirectTo: 'login' }
];
