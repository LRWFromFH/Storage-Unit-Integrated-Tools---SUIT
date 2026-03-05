import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Units } from './units';

describe('Units', () => {
  let component: Units;
  let fixture: ComponentFixture<Units>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Units, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
