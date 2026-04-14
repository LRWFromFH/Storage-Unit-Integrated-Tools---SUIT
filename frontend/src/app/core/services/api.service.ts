import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080';

  // ——— Search ———
  async search(query: string): Promise<{ customers: any[]; units: any[] }> {
    return firstValueFrom(
      this.http.post<{ customers: any[]; units: any[] }>(
        `${this.apiUrl}/api/search`,
        { query },
        { withCredentials: true }
      )
    );
  }

  // ——— Stats ———
  async getStats(): Promise<{ totalUnits: number; occupiedUnits: number; availableUnits: number; totalTenants: number }> {
    const [unitsRes, tenantsRes] = await Promise.all([
      firstValueFrom(this.http.get<{ units: any[] }>(`${this.apiUrl}/api/units`, { withCredentials: true })),
      firstValueFrom(this.http.get<{ customers: any[] }>(`${this.apiUrl}/api/customers`, { withCredentials: true }))
    ]);
    const units = unitsRes?.units ?? [];
    const tenants = tenantsRes?.customers ?? [];
    return {
      totalUnits: units.length,
      occupiedUnits: units.filter((u: any) => u.status?.toLowerCase() === 'occupied').length,
      availableUnits: units.filter((u: any) => u.status?.toLowerCase() === 'available').length,
      totalTenants: tenants.length,
    };
  }

  // ——— Employees ———
  async getEmployees(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ employees: any[] }>(`${this.apiUrl}/api/employees`, { withCredentials: true })
    );
    return res?.employees ?? [];
  }

  async updateEmployeeRole(id: number, role: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/employees/${id}/role`, { role }, { withCredentials: true })
    );
  }

  // ——— Tenant Edit ———
  async updateTenant(id: number, data: any): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/api/customers/${id}`, data, { withCredentials: true })
    );
  }

  // ——— Tenants / Customers ———
  async getCustomersList(): Promise<any[]> {
    const res = await firstValueFrom(
      this.http.get<{ customers: any[] }>(`${this.apiUrl}/api/customers`, { withCredentials: true })
    );
    return res?.customers ?? [];
  }

  // ——— Units List ———
  async getUnitsList(): Promise<any[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ units: any[] }>(`${this.apiUrl}/api/AvailableUnits`, { withCredentials: true })
      );
      let allUnits = res?.units ?? [];

      // Since the backend doesn't have an explicit 'get all units' endpoint,
      // we extract the occupied units bundled inside the customers payload
      const customersRes = await firstValueFrom(
        this.http.get<{ customers: any[] }>(`${this.apiUrl}/api/customers`, { withCredentials: true })
      ).catch(() => null);

      if (customersRes && customersRes.customers) {
        customersRes.customers.forEach(customer => {
          if (customer.Units && Array.isArray(customer.Units)) {
            allUnits = [...allUnits, ...customer.Units];
          }
        });
      }

      return allUnits;
    } catch (e) {
      console.error('Failed to aggregate units:', e);
      return [];
    }
  }

  // ——— Unit Detail ———
  async getUnit(id: number): Promise<any> {
    const res = await firstValueFrom(
      this.http.get<{ unit: any }>(`${this.apiUrl}/api/units/${id}`, { withCredentials: true })
    );
    return res?.unit;
  }
}
