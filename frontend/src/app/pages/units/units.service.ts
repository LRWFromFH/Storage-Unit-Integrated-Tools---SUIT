import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Unit } from './unit.model';

@Injectable({ providedIn: 'root' })
export class UnitsService {

  private mockUnits: Unit[] = [
    {
      id: '1',
      unitNumber: 'A101',
      unitType: '5x5',
      sizeSqFt: 25,
      floor: 1,
      climateControlled: true,
      pricePerMonth: 75,
      status: 'Available',
      insuranceRequired: true,
      lastUpdated: new Date()
    },
    {
      id: '2',
      unitNumber: 'B202',
      unitType: '10x10',
      sizeSqFt: 100,
      floor: 2,
      climateControlled: false,
      pricePerMonth: 150,
      status: 'Occupied',
      tenantName: 'John Doe',
      moveInDate: new Date(),
      insuranceRequired: true,
      lastUpdated: new Date()
    }
  ];

  private unitsSubject = new BehaviorSubject<Unit[]>(this.mockUnits);
  units$ = this.unitsSubject.asObservable();

  getUnits(): Observable<Unit[]> {
    // return this.http.get<Unit[]>('/api/units');
    return this.units$;
  }

  addUnit(unit: Unit) {
    // return this.http.post('/api/units', unit);
    this.mockUnits = [...this.mockUnits, unit];
    this.unitsSubject.next(this.mockUnits);
  }

  updateUnit(updated: Unit) {
    // return this.http.put(`/api/units/${updated.id}`, updated);
    this.mockUnits = this.mockUnits.map(u =>
      u.id === updated.id ? updated : u
    );
    this.unitsSubject.next(this.mockUnits);
  }

  deleteUnit(id: string) {
    // return this.http.delete(`/api/units/${id}`);
    this.mockUnits = this.mockUnits.filter(u => u.id !== id);
    this.unitsSubject.next(this.mockUnits);
  }
}