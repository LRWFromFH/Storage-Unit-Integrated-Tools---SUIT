// tenants.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer, CustomersResponse } from './tenants.model';

@Injectable({ providedIn: 'root' })
export class TenantsService {

  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<CustomersResponse>(`${this.API_URL}/customers`).pipe(
      map(response => response.customers || [])
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