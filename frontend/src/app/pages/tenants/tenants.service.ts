import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer, CustomersResponse, LedgerEntry, TransactionsResponse, Note, NotesResponse } from './tenants.model';
import { Unit, UnitsResponse } from '../units/unit.model';

export interface PaymentRequest {
  customer_id: number;
  unit_id: number;
  amount: number;
  description: string;
}

export interface ChargeRequest {
  customer_id: number;
  unit_id: number;
  amount: number;
  description: string;
}

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

  getCustomerBalance(customerId: number): Observable<number> {
    return this.http.get<{ balance: number }>(`${this.API_URL}/customers/${customerId}/balance`).pipe(
      map(response => response.balance)
    );
  }

  getCustomerTransactions(customerId: number): Observable<LedgerEntry[]> {
    return this.http.get<TransactionsResponse>(`${this.API_URL}/customers/${customerId}/transactions`).pipe(
      map(response => response.transactions || [])
    );
  }

  postPayment(req: PaymentRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/PostPayment`, req);
  }

  postCharge(req: ChargeRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/PostCharge`, req);
  }

  getNotes(customerId: number): Observable<Note[]> {
    return this.http.get<NotesResponse>(`${this.API_URL}/customers/${customerId}/notes`).pipe(
      map(response => response.notes || [])
    );
  }

  postNote(customerId: number, content: string): Observable<any> {
    return this.http.post(`${this.API_URL}/customers/${customerId}/notes`, { content });
  }

  deleteNote(customerId: number, noteId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/customers/${customerId}/notes/${noteId}`);
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