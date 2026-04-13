import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Unit, UnitsResponse } from './unit.model';

@Injectable({ providedIn: 'root' })
export class UnitsService {

  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getUnits(): Observable<Unit[]> {
    return this.http.get<UnitsResponse>(`${this.API_URL}/AvailableUnits`).pipe(
      map(response => response.units || [])
    );
  }

  createUnit(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/units`, payload);
  }

  updateUnit(unitNumber: string, payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}`, payload);
  }

  deleteUnit(unitNumber: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}`);
  }
}