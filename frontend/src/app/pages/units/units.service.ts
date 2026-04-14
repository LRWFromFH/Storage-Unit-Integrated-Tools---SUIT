import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { Unit } from './unit.model';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class UnitsService {

  private apiService = inject(ApiService);
  private unitsSubject = new BehaviorSubject<any[]>([]);
  units$ = this.unitsSubject.asObservable();

  getUnits(): Observable<any[]> {
    from(this.apiService.getUnitsList()).subscribe(units => {
      this.unitsSubject.next(units);
    });
    return this.units$;
  }

  addUnit(unit: any) {
    // Add logic here to call actual API when implemented
    const current = this.unitsSubject.value;
    this.unitsSubject.next([...current, unit]);
  }

  updateUnit(updated: any) {
    // Add logic here to call actual API when implemented
    const current = this.unitsSubject.value;
    this.unitsSubject.next(current.map(u => u.ID === updated.ID ? updated : u));
  }

  deleteUnit(id: string) {
    // Add logic here to call actual API when implemented
    const current = this.unitsSubject.value;
    this.unitsSubject.next(current.filter(u => u.ID !== id));
  }
}