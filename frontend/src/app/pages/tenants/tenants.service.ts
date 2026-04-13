import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer, CustomersResponse } from './tenants.model';
import { Unit, UnitsResponse } from '../units/unit.model';

@Injectable({ providedIn: 'root' })
export class TenantsService {

  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<CustomersResponse>(`${this.API_URL}/customers`).pipe(
      map(response => response.customers || [])
    );
  }

  getCustomerUnits(customerId: number): Observable<Unit[]> {
    return this.http.get<UnitsResponse>(`${this.API_URL}/customers/${customerId}/units`).pipe(
      map(response => response.units || [])
    );
  }

  createCustomer(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/customers`, payload);
  }

  updateCustomer(id: number, payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/customers/${id}`, payload);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/customers/${id}`);
  }
}