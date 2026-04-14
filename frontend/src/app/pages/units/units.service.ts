import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Unit, UnitsResponse, AssignUnitRequest, CombineUnitsRequest, InsuranceRecord, InsuranceResponse } from './unit.model';

export interface InsurancePayload {
  provider_name: string;
  policy_number: string;
  coverage_limit: number;
  expiry_date: string;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {

  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getUnits(): Observable<Unit[]> {
    return this.http.get<UnitsResponse>(`${this.API_URL}/AvailableUnits`).pipe(
      map(response => response.units || [])
    );
  }

  getAllUnits(): Observable<Unit[]> {
    return this.http.get<UnitsResponse>(`${this.API_URL}/AllUnits`).pipe(
      map(response => response.units || [])
    );
  }

  createUnit(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/units`, payload);
  }

  updateUnit(unitNumber: string, payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}`, payload);
  }

  /** Assigns or unassigns a unit to/from a customer while preserving all other fields. */
  assignUnit(unit: Unit, customerId: number | null): Observable<any> {
    const payload: AssignUnitRequest = {
      UnitNumber: unit.UnitNumber,
      SizeType:   unit.SizeType,
      Price:      unit.Price,
      Length:     unit.Length,
      Width:      unit.Width,
      Height:     unit.Height,
      CustomerID: customerId
    };
    return this.http.post(`${this.API_URL}/units/${encodeURIComponent(unit.UnitNumber)}`, payload);
  }

  combineUnits(payload: CombineUnitsRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/units/combine`, payload);
  }

  deleteUnit(unitNumber: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}`);
  }

  getInsurance(unitNumber: string): Observable<InsuranceRecord | null> {
    return this.http.get<InsuranceResponse>(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}/insurance`).pipe(
      map(response => response.insurance)
    );
  }

  postInsurance(unitNumber: string, payload: InsurancePayload): Observable<InsuranceRecord> {
    return this.http.post<InsuranceResponse>(`${this.API_URL}/units/${encodeURIComponent(unitNumber)}/insurance`, payload).pipe(
      map(response => response.insurance)
    );
  }
}