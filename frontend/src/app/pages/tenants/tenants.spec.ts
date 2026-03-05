// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { Tenants } from './tenants';

// describe('Tenants', () => {
//   let component: Tenants;
//   let fixture: ComponentFixture<Tenants>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [Tenants]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(Tenants);
//     component = fixture.componentInstance;
//     await fixture.whenStable();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tenants } from './tenants';
import { RouterTestingModule } from '@angular/router/testing';

describe('Tenants Component', () => {
  let component: Tenants;
  let fixture: ComponentFixture<Tenants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Tenants,
        RouterTestingModule   // ✅ FIX
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tenants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load mock tenants', () => {
    expect(component.tenants.length).toBeGreaterThan(0);
  });

  it('should toggle view mode', () => {
    const initial = component.viewMode;
    component.toggleView('grid');
    expect(component.viewMode).not.toBe(initial);
  });
});